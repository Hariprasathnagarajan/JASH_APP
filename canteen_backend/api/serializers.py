from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import CustomUser, MenuItem, Order, OrderItem, ShiftToken

class CustomUserCreateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)

    class Meta:
        model = CustomUser
        fields = ['username', 'user_id', 'first_name', 'last_name', 'email', 'role', 'work_shift']

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
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'work_shift', 'user_id', 'tokens']

    def get_tokens(self, obj):
        now = timezone.now()
        try:
            token_obj = obj.shift_tokens.get()
            return token_obj.count
        except ShiftToken.DoesNotExist:
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

class ShiftTokenSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Displays username
    shift = serializers.ChoiceField(choices=ShiftToken.SHIFT_CHOICES)

    class Meta:
        model = ShiftToken
        fields = ['id', 'user', 'count', 'shift']

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value

    def validate(self, data):
        user = self.context['request'].user if 'request' in self.context else None
        existing = ShiftToken.objects.filter(
            user=data['user'],
            shift=data['shift']
        )
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Token entry for this user, date, and shift already exists.")
        return data

    def create(self, data):
        return super().create(data)
