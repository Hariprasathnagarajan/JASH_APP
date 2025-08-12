from django.contrib.auth.models import AbstractUser
from django.db import models, IntegrityError
from django.utils import timezone
from django.contrib.auth.hashers import make_password

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('employee', 'Employee'),
        ('guest', 'Guest'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')
    user_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            # Set password to username before saving
            self.password = make_password(self.username)                
        
        super().save(*args, **kwargs)

    def current_tokens(self):
        now = timezone.now()
        try:
            token_obj = self.monthly_tokens.get(month=now.month, year=now.year)
            return token_obj.count
        except MonthlyToken.DoesNotExist:
            return 0

    def __str__(self):
        return self.username
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('employee', 'Employee'),
        ('guest', 'Guest'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='admin')
    user_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def current_tokens(self):
        now = timezone.now()
        try:
            token_obj = self.monthly_tokens.get(month=now.month, year=now.year)
            return token_obj.count
        except MonthlyToken.DoesNotExist:
            return 0

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


class MonthlyToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='monthly_tokens')
    count = models.PositiveIntegerField(default=0)
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.user.username} - {self.count} tokens ({self.month}/{self.year})"


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

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    tokens_per_item = models.PositiveIntegerField()

    @property
    def total_tokens(self):
        return self.tokens_per_item * self.quantity

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"