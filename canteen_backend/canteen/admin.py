from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, MenuItem, MonthlyToken, Order, OrderItem

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'employee_id', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'employee_id')}),
        ('Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'employee_id', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('username', 'first_name', 'last_name', 'email', 'employee_id')
    ordering = ('-date_joined',)
    filter_horizontal = ('groups', 'user_permissions',)

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_available', 'created_at', 'updated_at')
    list_filter = ('is_available', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('price', 'is_available')
    list_per_page = 20

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    raw_id_fields = ('menu_item',)
    readonly_fields = ('get_item_price',)
    
    def get_item_price(self, instance):
        return instance.menu_item.price
    get_item_price.short_description = 'Unit Price'

class MonthlyTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'year', 'tokens', 'get_user_role')
    list_filter = ('month', 'year', 'user__role')
    search_fields = ('user__username', 'user__employee_id')
    list_select_related = ('user',)
    
    def get_user_role(self, obj):
        return obj.user.get_role_display()
    get_user_role.short_description = 'User Role'
    get_user_role.admin_order_field = 'user__role'

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'created_at', 'updated_at', 'total_cost')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__employee_id', 'id')
    inlines = [OrderItemInline]
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    actions = ['approve_orders', 'decline_orders']
    
    def total_cost(self, obj):
        return sum(item.menu_item.price * item.quantity for item in obj.orderitem_set.all())
    total_cost.short_description = 'Total Cost (Tokens)'
    
    def approve_orders(self, request, queryset):
        queryset.update(status='approved')
    approve_orders.short_description = "Mark selected orders as approved"
    
    def decline_orders(self, request, queryset):
        queryset.update(status='declined')
    decline_orders.short_description = "Mark selected orders as declined"

admin.site.register(User, CustomUserAdmin)
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(MonthlyToken, MonthlyTokenAdmin)
admin.site.register(Order, OrderAdmin)