<?php

return [
    // When false (default), audit logging will skip GET requests (page views).
    // Set to true to allow writing audit entries for GET requests.
    'log_get_requests' => env('AUDIT_LOG_GET_REQUESTS', false),
];
