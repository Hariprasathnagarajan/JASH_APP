from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MenuItem, MonthlyToken, Order, OrderItem
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'employee_id']
        extra_kwargs = {'password': {'write_only': True}}

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        refresh = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

class MonthlyTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyToken
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='orderitem_set', many=True)
    user = UserSerializer()
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'items', 'status', 'created_at', 'updated_at']

class CreateOrderSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    class Meta:
        model = Order
        fields = ['items']
    
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')
        
        # Check if user has tokens
        current_month = timezone.now().month
        current_year = timezone.now().year
        try:
            token = MonthlyToken.objects.get(
                user=user,
                month=current_month,
                year=current_year
            )
        except MonthlyToken.DoesNotExist:
            raise serializers.ValidationError("No tokens allocated for this month")
        
        # Calculate total cost
        total_cost = 0
        for item_data in items_data:
            try:
                menu_item = MenuItem.objects.get(id=item_data['id'], is_available=True)
                total_cost += menu_item.price * item_data['quantity']
            except MenuItem.DoesNotExist:
                raise serializers.ValidationError(f"Menu item {item_data['id']} not available")
        
        if token.tokens < total_cost:
            raise serializers.ValidationError("Insufficient tokens")
        
        # Create order
        order = Order.objects.create(user=user)
        for item_data in items_data:
            menu_item = MenuItem.objects.get(id=item_data['id'])
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item_data['quantity']
            )
        
        # Deduct tokens
        token.tokens -= total_cost
        token.save()
        
        return order