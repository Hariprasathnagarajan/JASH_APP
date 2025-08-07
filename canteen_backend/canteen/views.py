from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import User, MenuItem, MonthlyToken, Order
from .serializers import (
    UserSerializer, LoginSerializer, MenuItemSerializer,
    MonthlyTokenSerializer, OrderSerializer, CreateOrderSerializer
)
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import datetime

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'staff'

class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'employee'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsStaff]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        if self.request.user.role == 'employee':
            return self.queryset.filter(is_available=True)
        return self.queryset

class MonthlyTokenViewSet(viewsets.ModelViewSet):
    queryset = MonthlyToken.objects.all()
    serializer_class = MonthlyTokenSerializer
    permission_classes = [IsAdmin]
    
    @action(detail=False, methods=['post'])
    def refresh_all(self, request):
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # Get all active users except admins
        users = User.objects.filter(is_active=True).exclude(role='admin')
        
        for user in users:
            # Default token count (could be made configurable)
            token_count = 100 if user.role == 'employee' else 0  # Staff might not need tokens
            
            # Create or update token for the current month
            MonthlyToken.objects.update_or_create(
                user=user,
                month=current_month,
                year=current_year,
                defaults={'tokens': token_count}
            )
        
        return Response({"message": "Tokens refreshed for all users"}, status=status.HTTP_200_OK)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    authentication_classes = [JWTAuthentication]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsStaff]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'employee':
            # Employees can only see their own orders
            return self.queryset.filter(user=user).order_by('-created_at')
        elif user.role == 'staff':
            # Staff can see all orders, filter by query params if provided
            queryset = self.queryset.all()
            
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(
                    Q(user__username__icontains=search) |
                    Q(user__employee_id__icontains=search) |
                    Q(id__icontains=search)
                )
            
            return queryset.order_by('-created_at')
        else:
            # Admin can see all orders
            return self.queryset.all().order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Return the created order with full details
        order_serializer = OrderSerializer(order, context={'request': request})
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        order = self.get_object()
        order.status = 'approved'
        order.save()
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['patch'])
    def decline(self, request, pk=None):
        order = self.get_object()
        order.status = 'declined'
        order.save()
        
        # Refund tokens if order is declined
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        try:
            token = MonthlyToken.objects.get(
                user=order.user,
                month=current_month,
                year=current_year
            )
            
            # Calculate total cost of the order
            total_cost = sum(
                item.menu_item.price * item.quantity 
                for item in order.orderitem_set.all()
            )
            
            # Refund the tokens
            token.tokens += total_cost
            token.save()
        except MonthlyToken.DoesNotExist:
            pass
        
        return Response(OrderSerializer(order).data)

class ProfileViewSet(viewsets.ViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        user = request.user
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        try:
            token = MonthlyToken.objects.get(
                user=user,
                month=current_month,
                year=current_year
            )
            tokens_remaining = token.tokens
        except MonthlyToken.DoesNotExist:
            tokens_remaining = 0
        
        data = {
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'employee_id': user.employee_id,
            'role': user.get_role_display(),
            'tokens_remaining': tokens_remaining
        }
        
        return Response(data)