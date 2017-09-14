API to expose to JS:
```C
void do_something(void (*when_done)(void));
```

Use case (JS):
```JS
addon.do_something(function() {});
addon.do_something(function() {});
```

Note that this is equivalent to
```JS
function callback() {}
var oneBinding = callback.bind("1");
var twoBinding = callback.bind("2");
addon.do_something(oneBinding);
addon.do_something(twoBinding);
```

because `oneBinding !== twoBinding`.

Implementation (C):
```C
jerry_value_t js_callback;

void call_js_do_something_callback() {
  jerry_value_t global = jerry_get_global_object();
  jerry_call_function(js_callback, global, NULL, 0);
  jerry_release_value (global);
}

jerry_value_t bind__do_something(const jerry_value_t func,
                                 const jerry_value_t this_val,
                                 const jerry_value_t args_p[],
                                 const jerry_length_t args_count)
{
  js_callback = jerry_acquire_value(args_p[0]);
  do_something(call_js_do_something_callback);
  return 0;
}
```
