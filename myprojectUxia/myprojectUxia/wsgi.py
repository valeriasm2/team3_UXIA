"""
WSGI config for myprojectUxia project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myprojectUxia.settings')

_application = get_wsgi_application()

def application(environ, start_response):
    script_name = environ.get('SCRIPT_NAME', '')
    if script_name:
        environ['PATH_INFO'] = script_name + environ.get('PATH_INFO', '')
        environ['SCRIPT_NAME'] = ''
    return _application(environ, start_response)
