from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MenuItem, Order, OrderItem

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'work_shift', 'monthly_tokens', 'last_token_reset']
    list_filter = ['role', 'is_active', 'is_staff', 'work_shift']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'user_id']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'work_shift', 'user_id', 'monthly_tokens', 'last_token_reset')}),
    )
    readonly_fields = ('last_token_reset',)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price','description', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at']
    search_fields = ['name', 'description']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_tokens', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'tokens_per_item']
