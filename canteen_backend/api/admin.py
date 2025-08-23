from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MenuItem, Order, OrderItem, MonthlyToken

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'work_shift', 'user_id']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'user_id']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'work_shift', 'user_id')}),
    )   

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

@admin.register(MonthlyToken)
class MonthlyTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'count', 'month', 'year']
    list_filter = ['month', 'year']
    search_fields = ['user__username']
