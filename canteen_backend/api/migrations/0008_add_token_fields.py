from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_add_token_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='monthly_tokens',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='customuser',
            name='last_token_reset',
            field=models.DateField(default=django.utils.timezone.now),
        ),
    ]
