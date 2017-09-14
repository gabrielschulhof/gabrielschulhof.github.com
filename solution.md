Such a C API cannot be bound without relying on trampoline or libffi. At minimum, we need
```C
void do_something(void (*when_done) (void *),
                  void *context);
```

Then we can implement like so
```C
void call_js_do_something_callback(void *context) {
  jerry_value_t global = jerry_get_global_object();
  jerry_call_function((jerry_value_t)context, global, NULL, 0);
  jerry_release_value (global);
}

jerry_value_t bind__do_something(const jerry_value_t func,
                                 const jerry_value_t this_val,
                                 const jerry_value_t args_p[],
                                 const jerry_length_t args_count)
{
  js_callback = jerry_acquire_value(args_p[0]);
  do_something(call_js_do_something_callback, (void *)jerry_acquire_value(args_p[0]));
  return 0;
}
```
