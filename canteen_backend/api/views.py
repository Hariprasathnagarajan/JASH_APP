from datetime import timedelta
from django.db.models import Q, Count, Sum, F
from django.utils import timezone
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .permissions import IsAdmin, IsStaffOrAdmin, IsEmployee, IsGuest
from .models import CustomUser, MenuItem, Order
from .serializers import (
    CustomUserSerializer, CustomUserCreateSerializer, LoginSerializer,
    MenuItemSerializer, OrderSerializer
)


# CSRF token view
@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([AllowAny])
def csrf_token_view(request):
    response = Response({'message': 'CSRF cookie set'})
    response['X-CSRFToken'] = request.META.get('CSRF_COOKIE', '')
    return response


# Login view
@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    login(request, user)
    
    # Get or create a new session
    if not request.session.session_key:
        request.session.create()
    
    # Set session cookie attributes
    request.session.modified = True
    
    # Serialize user data
    user_serializer = CustomUserSerializer(user)
    
    response = Response({
        'message': 'Login successful', 
        'user': user_serializer.data,
        'sessionid': request.session.session_key
    })
    
    # Set session cookie
    response.set_cookie(
        'sessionid', 
        request.session.session_key,
        httponly=True,
        samesite='Lax',
        max_age=1209600  # 2 weeks
    )
    
    return response


# Logout view
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Get session key before logging out
    session_key = request.session.session_key
    
    # Logout the user
    logout(request)
    
    # Delete the session from the database
    if session_key:
        from django.contrib.sessions.models import Session
        try:
            Session.objects.get(session_key=session_key).delete()
        except Session.DoesNotExist:
            pass
    
    # Create response
    response = Response({'message': 'Logout successful'})
    
    # Delete the session cookie
    response.delete_cookie('sessionid')
    response.delete_cookie('csrftoken')
    
    return response


# Profile view
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)


# Admin user management
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

        # Only create tokens for non-admin and non-staff users
        if user.role not in ['admin', 'staff']:
            MonthlyToken.objects.create(
                user=user,
                count=0,
                month=timezone.now().month,
                year=timezone.now().year
            )
            
        output_serializer = CustomUserSerializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


# Token refresh
@api_view(['POST'])
@permission_classes([IsAdmin])
def refresh_monthly_tokens(request):
    try:
        token_count = int(request.data.get('count', 100))
        if token_count <= 0:
            return Response(
                {'error': 'Token count must be a positive number'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get all non-admin, non-staff users
        users = CustomUser.objects.exclude(role__in=['admin', 'staff'])
        now = timezone.now().date()
        
        # Update tokens for each user
        updated = users.update(
            monthly_tokens=token_count,
            last_token_reset=now
        )
        
        return Response({
            'message': f'Successfully refreshed tokens for {updated} users',
            'tokens_assigned': token_count,
            'users_updated': updated,
            'reset_date': now
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid token count'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Staff: Menu management
class StaffMenuViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsStaffOrAdmin]


# Staff: Order management
class StaffOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        queryset = Order.objects.all()
        search = self.request.query_params.get('search')
        if search:
            query = Q(user__username__icontains=search) | Q(user__user_id__icontains=search)
            if str(search).isdigit():
                try:
                    query = query | Q(id=int(search))
                except ValueError:
                    pass
            queryset = queryset.filter(query)
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


# Employee: View menu
@api_view(['GET'])
@permission_classes([IsEmployee])
def employee_menu(request):
    menu_items = MenuItem.objects.filter(is_available=True)
    serializer = MenuItemSerializer(menu_items, many=True)
    return Response(serializer.data)


# ✅ Employee: Place order
@api_view(['POST'])
@permission_classes([IsEmployee])
def employee_place_order(request):
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
        token_obj = user.monthly_tokens.get(month=current_month, year=current_year)
    except MonthlyToken.DoesNotExist:
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
    orders = Order.objects.filter(employee=request.user).prefetch_related('order_items__menu_item')
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


# ✅ Guest: View orders
@api_view(['GET'])
@permission_classes([IsGuest])
def guest_orders(request):
    orders = Order.objects.filter(guest=request.user).prefetch_related('order_items__menu_item')
    today = timezone.now().date()

    today_orders = orders.filter(created_at__date=today)
    past_orders = orders.exclude(created_at__date=today)

    today_serializer = OrderSerializer(today_orders, many=True)
    past_serializer = OrderSerializer(past_orders, many=True)

    return Response({
        'today_orders': today_serializer.data,
        'past_orders': past_serializer.data
    })


# ✅ Guest: Place order
@api_view(['POST'])
@permission_classes([IsGuest])
def guest_place_order(request):
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
        token_obj = user.monthly_tokens.get(month=current_month, year=current_year)
    except MonthlyToken.DoesNotExist:
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


# Token Management
@api_view(['POST'])
@permission_classes([IsAdmin])
def assign_tokens(request):
    shift = request.data.get('shift')
    
    if not shift or shift not in ['day', 'mid', 'night']:
        return Response(
            {'error': 'Invalid shift'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shift_limits = {'day': 50, 'mid': 75, 'night': 100}
    
    # Check if it's within the first 3 days of the month
    today = date.today()
    if today.day > 3:
        return Response(
            {'error': 'Tokens can only be assigned within the first 3 days of the month'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    users = CustomUser.objects.filter(
        work_shift=shift,
        role__in=['employee', 'guest']
    )
    
    updated = users.update(monthly_tokens=shift_limits[shift])
    
    return Response({
        'status': 'success',
        'updated': updated,
        'tokens_assigned': shift_limits[shift],
        'shift': shift
    })

@api_view(['GET'])
@permission_classes([IsAdmin])
def get_token_summary(request):
    users = CustomUser.objects.filter(
        role__in=['employee', 'guest']
    ).order_by('work_shift', 'username')
    
    summary = {
        'day_shift': {'users': [], 'total_tokens': 0},
        'mid_shift': {'users': [], 'total_tokens': 0},
        'night_shift': {'users': [], 'total_tokens': 0}
    }
    
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'name': f"{user.first_name} {user.last_name}".strip(),
            'tokens': user.monthly_tokens,
            'role': user.role
        }
        
        if user.work_shift in summary:
            summary[user.work_shift]['users'].append(user_data)
            summary[user.work_shift]['total_tokens'] += user.monthly_tokens
    
    return Response(summary)

# Dashboard views
@api_view(['GET'])
@permission_classes([IsAdmin])
def get_dashboard_stats(request):
    """Get statistics for the admin dashboard"""
    try:
        print("Starting dashboard stats calculation...")
        
        # Total users count
        total_users = CustomUser.objects.count()
        print(f"Total users: {total_users}")
        
        # User growth (percentage change from last month)
        last_month = timezone.now() - timedelta(days=30)
        previous_users = CustomUser.objects.filter(
            date_joined__lt=last_month
        ).count()
        
        user_growth = 0
        if previous_users > 0:
            user_growth = ((total_users - previous_users) / previous_users) * 100
        
        # Menu items count
        total_menu_items = MenuItem.objects.count()
        print(f"Total menu items: {total_menu_items}")
        
        # New items this week
        new_items_this_week = MenuItem.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Today's revenue
        today = timezone.now().date()
        print(f"Calculating revenue for {today}")
        
        try:
            todays_orders = Order.objects.filter(
                created_at__date=today,
                status='completed'
            )
            todays_revenue = todays_orders.aggregate(total=Sum('total_amount'))['total'] or 0
            print(f"Today's revenue: {todays_revenue}")
            
            # Revenue change from yesterday
            yesterday = today - timedelta(days=1)
            yesterdays_orders = Order.objects.filter(
                created_at__date=yesterday,
                status='completed'
            )
            yesterdays_revenue = yesterdays_orders.aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_change = 0
            if yesterdays_revenue > 0:
                revenue_change = ((todays_revenue - yesterdays_revenue) / yesterdays_revenue) * 100
        except Exception as e:
            print(f"Error calculating revenue: {str(e)}")
            todays_revenue = 0
            revenue_change = 0
        
        # Pending orders
        try:
            pending_orders = Order.objects.filter(status='pending').count()
            print(f"Pending orders: {pending_orders}")
            
            # Pending change from yesterday
            yesterday = timezone.now().date() - timedelta(days=1)
            yesterdays_pending = Order.objects.filter(
                created_at__date=yesterday,
                status='pending'
            ).count()
            pending_change = pending_orders - yesterdays_pending
        except Exception as e:
            print(f"Error calculating pending orders: {str(e)}")
            pending_orders = 0
            pending_change = 0
        
        # Get shift-wise employee counts
        try:
            shift_employees = list(CustomUser.objects.filter(role='employee').values('work_shift').annotate(
                count=Count('id')
            ))
            print(f"Shift employees: {shift_employees}")
            
            # Get shift-wise guest counts
            shift_guests = list(CustomUser.objects.filter(role='guest').values('work_shift').annotate(
                count=Count('id')
            ))
            print(f"Shift guests: {shift_guests}")
        except Exception as e:
            print(f"Error getting shift data: {str(e)}")
            shift_employees = []
            shift_guests = []
        
        # Get total staff count
        total_staff = CustomUser.objects.filter(role='staff').count()
        
        # Format shift data with default values
        shift_data = {
            'employees': {item['work_shift']: item['count'] for item in shift_employees if item.get('work_shift')},
            'guests': {item['work_shift']: item['count'] for item in shift_guests if item.get('work_shift')}
        }
        
        # Ensure all shifts have values
        for shift in ['day', 'mid', 'night']:
            if shift not in shift_data['employees']:
                shift_data['employees'][shift] = 0
            if shift not in shift_data['guests']:
                shift_data['guests'][shift] = 0
        
        response_data = {
            'totalUsers': total_users,
            'userGrowth': round(user_growth, 1),
            'totalMenuItems': total_menu_items,
            'newItemsThisWeek': new_items_this_week,
            'todaysRevenue': float(todays_revenue),
            'revenueChange': round(revenue_change, 1),
            'pendingOrders': pending_orders,
            'pendingChange': pending_change,
            'shiftData': shift_data,
            'totalStaff': total_staff,
            'status': 'success'
        }
        
        print("Dashboard stats calculated successfully")
        return Response(response_data)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_dashboard_stats: {str(e)}\n{error_trace}")
        return Response(
            {'error': 'Failed to load dashboard statistics', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_recent_orders(request):
    """Get recent orders for the admin dashboard"""
    limit = int(request.query_params.get('limit', 5))
    orders = Order.objects.select_related('employee', 'guest')\
                         .prefetch_related('order_items__menu_item')\
                         .order_by('-created_at')[:limit]
    
    data = []
    for order in orders:
        user_name = order.employee.username if order.employee else order.guest.username
        items = [f"{item.quantity}x {item.menu_item.name}" for item in order.order_items.all()]
        
        data.append({
            'id': order.id,
            'userName': user_name,
            'items': items,
            'totalAmount': float(order.total_amount),
            'status': order.status,
            'createdAt': order.created_at
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_revenue_data(request):
    """Get revenue data for charts"""
    period = request.query_params.get('period', 'week')
    end_date = timezone.now().date()
    
    if period == 'week':
        start_date = end_date - timedelta(days=6)
        date_range = [start_date + timedelta(days=x) for x in range(7)]
    elif period == 'month':
        start_date = end_date - timedelta(days=29)
        date_range = [start_date + timedelta(days=x) for x in range(30)]
    else:  # year
        start_date = end_date - timedelta(days=364)
        date_range = [start_date + timedelta(days=x*30) for x in range(12)]
    
    # Get completed orders in the date range
    orders = Order.objects.filter(
        created_at__date__range=[start_date, end_date],
        status='completed'
    )
    
    # Group by date
    revenue_by_date = {}
    for order in orders:
        date = order.created_at.date()
        if date in revenue_by_date:
            revenue_by_date[date] += float(order.total_amount)
        else:
            revenue_by_date[date] = float(order.total_amount)
    
    # Fill in missing dates with 0
    data = []
    for date in date_range:
        data.append({
            'date': date,
            'amount': revenue_by_date.get(date, 0)
        })
    
    return Response(data)