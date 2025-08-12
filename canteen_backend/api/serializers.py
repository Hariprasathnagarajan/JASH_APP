from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import CustomUser, MenuItem, Order, OrderItem, MonthlyToken

class CustomUserCreateSerializer(serializers.ModelSerializer):
    # password = serializers.CharField(write_only=True, required=True, min_length=8)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)

    class Meta:
        model = CustomUser
        fields = ['username', 'user_id', 'first_name', 'last_name', 'email', 'role']

    def create(self, validated_data):
        password = validated_data.pop('user_id')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomUserSerializer(serializers.ModelSerializer):
    tokens = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'user_id', 'tokens']

    def get_tokens(self, obj):
        now = timezone.now()
        try:
            token_obj = obj.monthly_tokens.get(month=now.month, year=now.year)
            return token_obj.count
        except MonthlyToken.DoesNotExist:
            return 0

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        raise serializers.ValidationError('Must include username and password')

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_id', 'quantity', 'tokens_per_item']

class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    items = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_details', 'status', 'total_tokens', 'created_at', 'updated_at', 'order_items', 'items']
        read_only_fields = ['user', 'total_tokens']

    def get_user_details(self, obj):
        return {
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'user_id': obj.user.user_id
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user

        order = Order.objects.create(user=user, **validated_data)
        total_tokens = 0

        for item_data in items_data:
            menu_item = MenuItem.objects.get(id=item_data['menu_item_id'])
            quantity = item_data['quantity']
            tokens_per_item = menu_item.price

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                tokens_per_item=tokens_per_item
            )
            total_tokens += tokens_per_item * quantity

        order.total_tokens = total_tokens
        order.save()

        return order

class MonthlyTokenSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyToken
        fields = ['id', 'user', 'user_details', 'count', 'month', 'year', 'updated_at']

    def get_user_details(self, obj):
        return {
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'user_id': obj.user.user_id
        }
