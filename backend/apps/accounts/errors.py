from rest_framework.views import exception_handler

def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        details = response.data
        if isinstance(details, dict) and "detail" in details:
            message = str(details["detail"])
        elif isinstance(details, dict) and isinstance(details.get("non_field_errors"), list) and details["non_field_errors"]:
            message = str(details["non_field_errors"][0])
        else:
            message = "Please check the submitted information."
        response.data = {"error": {"message": message, "details": details}}
    return response
