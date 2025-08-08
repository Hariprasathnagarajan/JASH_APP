from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from canteen.views import (
    UserViewSet, AuthViewSet, MenuItemViewSet,
    MonthlyTokenViewSet, OrderViewSet, ProfileViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'auth', AuthViewSet, basename='auth')  
router.register(r'menu', MenuItemViewSet)
router.register(r'tokens', MonthlyTokenViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('api/', include(router.urls)),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),

]
