from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-users')
router.register(r'staff/menu', views.StaffMenuViewSet, basename='staff-menu')
router.register(r'staff/orders', views.StaffOrderViewSet, basename='staff-orders')


urlpatterns = [
    path('', include(router.urls)),

    # Auth endpoints
    path('csrf/', views.csrf_token_view, name='csrf_token'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),

    # Admin endpoints
    path('admin/dashboard/stats/', views.get_dashboard_stats, name='dashboard_stats'),
    path('admin/dashboard/orders/recent/', views.get_recent_orders, name='recent_orders'),
    path('admin/dashboard/revenue/', views.get_revenue_data, name='revenue_data'),
    path('admin/tokens/refresh/', views.refresh_monthly_tokens, name='refresh_tokens'),

    # Employee endpoints
    path('employee/menu/', views.employee_menu, name='employee_menu'),
    path('employee/order/', views.employee_place_order, name='employee_place_order'),
    path('employee/orders/', views.employee_orders, name='employee_orders'),
   
     # Guest endpoints
    path('guest/menu/', views.guest_menu, name='guest_menu'),
    path('guest/order/', views.guest_place_order, name='guest_order'),
    path('guest/orders/', views.guest_orders, name='guest_orders'),
]
