from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Reset monthly tokens for all users on the 1st of each month'

    def handle(self, *args, **options):
        today = timezone.now().date()
        if today.day != 1:
            self.stdout.write(self.style.WARNING(
                'This command should only be run on the 1st of the month'
            ))
            return

        User = get_user_model()
        updated = User.objects.update(
            monthly_tokens=0,
            last_token_reset=today
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Reset tokens for {updated} users')
        )
