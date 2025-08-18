from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import CustomUser, MenuItem, Order, ShiftToken
from .serializers import (
    CustomUserSerializer, CustomUserCreateSerializer, LoginSerializer,
    MenuItemSerializer, OrderSerializer, ShiftTokenSerializer
)
from .permissions import IsAdmin, IsGuest, IsStaffOrAdmin, IsEmployee


# ✅ CSRF token view
@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([AllowAny])
def csrf_token_view(request):
    return Response({'message': 'CSRF cookie set'})


# ✅ Login view
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    login(request, user)
# Adding Token for header
    user_serializer = CustomUserSerializer(user)
    return Response({'message': 'Login successful', 'user': user_serializer.data})


# ✅ Logout view
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout successful'})


# ✅ Profile view
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)


# ✅ Admin user management
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.exclude(role='admin')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return CustomUserCreateSerializer
        return CustomUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        MonthlyToken.objects.create(
            user=user,
            count=0,
            month=timezone.now().month,
            year=timezone.now().year
        )
        print(user)
        output_serializer = CustomUserSerializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


# ✅ Token refresh
@api_view(['POST'])
@permission_classes([IsAdmin])
def refresh_monthly_tokens(request):
    token_count = request.data.get('token_count', 1500)

    users = CustomUser.objects.all()
    for user in users:
        token_obj, created = ShiftToken.objects.get_or_create(
            user=user,
            defaults={'count': token_count}
        )
        if not created:
            token_obj.count = token_count
            token_obj.save()

    return Response({'message': f'Tokens refreshed for all users: {token_count} tokens'})


# ✅ Staff: Menu management
class StaffMenuViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsStaffOrAdmin]


# ✅ Staff: Order management
class StaffOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        queryset = Order.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__user_id__icontains=search) |
                Q(id__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['approved', 'declined', 'completed']:
            order.status = new_status
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


# ✅ Employee: View menu
@api_view(['GET'])
@permission_classes([IsEmployee])
def employee_menu(request):
    menu_items = MenuItem.objects.filter(is_available=True)
    serializer = MenuItemSerializer(menu_items, many=True)
    return Response(serializer.data)


# ✅ Employee: Place order
@api_view(['POST'])
@permission_classes([IsEmployee])
def place_order(request):
    items = request.data.get('items', [])
    if not items:
        return Response({'error': 'No items provided'}, status=status.HTTP_400_BAD_REQUEST)

    total_tokens_needed = 0
    for item in items:
        try:
            menu_item = MenuItem.objects.get(id=item['menu_item_id'])
            total_tokens_needed += menu_item.price * item['quantity']
        except MenuItem.DoesNotExist:
            return Response({'error': f'Menu item with id {item["menu_item_id"]} does not exist'},
                            status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    current_month = timezone.now().month
    current_year = timezone.now().year

    try:
        token_obj = user.shift_tokens.get(month=current_month, year=current_year)
    except ShiftToken.DoesNotExist:
        return Response({'error': 'No tokens available for this month'}, status=status.HTTP_400_BAD_REQUEST)

    if token_obj.count < total_tokens_needed:
        return Response(
            {'error': f'Insufficient tokens. Required: {total_tokens_needed}, Available: {token_obj.count}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = OrderSerializer(data={'items': items}, context={'request': request})
    serializer.is_valid(raise_exception=True)
    order = serializer.save()

    token_obj.count -= total_tokens_needed
    token_obj.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ✅ Employee: View orders
@api_view(['GET'])
@permission_classes([IsEmployee])
def employee_orders(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('order_items__menu_item')
    today = timezone.now().date()

    today_orders = orders.filter(created_at__date=today)
    past_orders = orders.exclude(created_at__date=today)

    today_serializer = OrderSerializer(today_orders, many=True)
    past_serializer = OrderSerializer(past_orders, many=True)

    return Response({
        'today_orders': today_serializer.data,
        'past_orders': past_serializer.data
    })


# ✅ Guest: View menu
@api_view(['GET'])
@permission_classes([IsGuest])
def guest_menu(request):
    menu_items = MenuItem.objects.filter(is_available=True)
    serializer = MenuItemSerializer(menu_items, many=True)
    return Response(serializer.data)


# ✅ Guest: Place order
@api_view(['POST'])
@permission_classes([IsGuest])
def place_order(request):
    items = request.data.get('items', [])
    if not items:
        return Response({'error': 'No items provided'}, status=status.HTTP_400_BAD_REQUEST)

    total_tokens_needed = 0
    for item in items:
        try:
            menu_item = MenuItem.objects.get(id=item['menu_item_id'])
            total_tokens_needed += menu_item.price * item['quantity']
        except MenuItem.DoesNotExist:
            return Response({'error': f'Menu item with id {item["menu_item_id"]} does not exist'},
                            status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    current_month = timezone.now().month
    current_year = timezone.now().year

    try:
        token_obj = user.shift_tokens.get(month=current_month, year=current_year)
    except ShiftToken.DoesNotExist:
        return Response({'error': 'No tokens available for this month'}, status=status.HTTP_400_BAD_REQUEST)

    if token_obj.count < total_tokens_needed:
        return Response(
            {'error': f'Insufficient tokens. Required: {total_tokens_needed}, Available: {token_obj.count}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = OrderSerializer(data={'items': items}, context={'request': request})
    serializer.is_valid(raise_exception=True)
    order = serializer.save()

    token_obj.count -= total_tokens_needed
    token_obj.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ✅ Guest: View orders
@api_view(['GET'])
@permission_classes([IsGuest])
def guest_orders(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('order_items__menu_item')
    today = timezone.now().date()

    today_orders = orders.filter(created_at__date=today)
    past_orders = orders.exclude(created_at__date=today)

    today_serializer = OrderSerializer(today_orders, many=True)
    past_serializer = OrderSerializer(past_orders, many=True)

    return Response({
        'today_orders': today_serializer.data,
        'past_orders': past_serializer.data
    })