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

    def save(self, *args, **kwargs):
        if not self.pk:
            # Set password to username before saving
            self.password = make_password(self.username)                
        
        super().save(*args, **kwargs)

    def current_tokens(self):
        now = timezone.now()
        try:
            token_obj = self.shift_tokens.get(month=now.month, year=now.year)
            return token_obj.count
        except ShiftToken.DoesNotExist:
            return 0

    def __str__(self):
        return self.username
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

    def current_tokens(self):
        now = timezone.now()
        try:
            token_obj = self.shift_tokens.get(month=now.month, year=now.year)
            return token_obj.count
        except ShiftToken.DoesNotExist:
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


class ShiftToken(models.Model):
    SHIFT_CHOICES = [
        ('morning', 'Morning'),
        ('evening', 'Evening'),
        ('night', 'Night'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='shift_tokens')
    count = models.PositiveIntegerField(default=0)
    shift = models.CharField(max_length=10, choices=SHIFT_CHOICES)

    class Meta:
        unique_together = ['user', 'shift']
        ordering = ['-id', 'shift']

    def __str__(self):
        return f"{self.user.username} - {self.count} tokens ({self.shift} shift)"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approve', 'Approve'),
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