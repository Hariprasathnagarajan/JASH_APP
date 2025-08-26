from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password


class CustomUser(AbstractUser):
    WORK_SHIFT_CHOICES = [
        ('day', 'Day'),
        ('mid', 'Mid'),
        ('night', 'Night'),
    ]
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('employee', 'Employee'),
        ('guest', 'Guest'),
    ]
    work_shift = models.CharField(max_length=10, choices=WORK_SHIFT_CHOICES, default='day')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')
    user_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    monthly_tokens = models.PositiveIntegerField(default=0)
    last_token_reset = models.DateField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Only set a default password if creating and no password has been set
        if not self.pk and not self.password:
            self.password = make_password(self.username)
        super().save(*args, **kwargs)

    def current_tokens(self):
        # Admin and staff don't use tokens
        if self.role in ['admin', 'staff']:
            return 0
            
        # Check if we need to reset tokens (new month)
        now = timezone.now().date()
        if now.month != self.last_token_reset.month or now.year != self.last_token_reset.year:
            self.monthly_tokens = 0
            self.last_token_reset = now
            self.save(update_fields=['monthly_tokens', 'last_token_reset'])
            
        return self.monthly_tokens

    def __str__(self):
        return self.username


class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.PositiveIntegerField()  
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    total_tokens = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def total_amount(self):
        """Calculate total amount from order items"""
        return sum(item.tokens_per_item * item.quantity for item in self.order_items.all())

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='order_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    tokens_per_item = models.PositiveIntegerField()

    @property
    def total_tokens(self):
        return self.tokens_per_item * self.quantity

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"
      

class ShiftTokenAllocation(models.Model):
    SHIFT_CHOICES = CustomUser.WORK_SHIFT_CHOICES

    shift = models.CharField(max_length=10, choices=SHIFT_CHOICES, db_index=True)
    tokens_per_user = models.PositiveIntegerField(default=0)
    allocation_month = models.DateField(default=timezone.now, db_index=True)

    class Meta:
        unique_together = ('shift', 'allocation_month')
        indexes = [
            models.Index(fields=['shift', 'allocation_month']),
        ]

    def save(self, *args, **kwargs):
        # normalize to first of the month
        self.allocation_month = self.allocation_month.replace(day=1)
        super().save(*args, **kwargs)

        # Apply tokens to all users in this shift
        # Use the allocation_month just saved, not the current month
        month_start = self.allocation_month
        users = CustomUser.objects.filter(work_shift=self.shift, role='employee')
        for user in users:
            dist, _ = TokenDistribution.objects.get_or_create(
                user=user,
                allocation_month=month_start
            )
            dist.assign_tokens(self.tokens_per_user, month_start)

    def __str__(self):
        return f"{self.get_shift_display()} shift - {self.tokens_per_user} tokens ({self.allocation_month.strftime('%b %Y')})"

class TokenDistribution(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='token_distributions', null=True, blank=True)
    tokens_allocated = models.PositiveIntegerField(default=0)
    allocation_month = models.DateField(default=timezone.now, db_index=True)

    class Meta:
        unique_together = ('user', 'allocation_month')
        indexes = [
            models.Index(fields=['user', 'allocation_month']),
        ]

    def save(self, *args, **kwargs):
        self.allocation_month = self.allocation_month.replace(day=1)
        super().save(*args, **kwargs)

    def assign_tokens(self, amount, month=None):
        month = month or timezone.now().date().replace(day=1)
        self.tokens_allocated = amount
        self.allocation_month = month
        self.save(update_fields=['tokens_allocated', 'allocation_month'])
        
        # sync with user
        self.user.monthly_tokens = amount
        self.user.last_token_reset = month
        self.user.save(update_fields=['monthly_tokens', 'last_token_reset'])

    def __str__(self):
        user_display = self.user.username if self.user else 'Unknown User'
        return f"{user_display} - {self.tokens_allocated} tokens ({self.allocation_month.strftime('%b %Y')})"
