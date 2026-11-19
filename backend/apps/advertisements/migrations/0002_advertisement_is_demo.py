from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("advertisements", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="advertisement",
            name="is_demo",
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
