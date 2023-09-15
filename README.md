# json-tpl

## Examples

### Plain json

```json
// Input
{
  "string": "Hello, World!",
  "number": 42,
  "boolean": true,
  "null": null,
  "array": ["Hello, World!", 42, true, null, ["Hello, World!", 42, true, null]]
}

// Output
{
  "string": "Hello, World!",
  "number": 42,
  "boolean": true,
  "null": null,
  "array": ["Hello, World!", 42, true, null, ["Hello, World!", 42, true, null]]
}
```

### Access variables

Short notation:

```json
// Input
"${ user.name }"

// Output
"John" // Or whathever "user.name" is
```

Expanded notation:

```json
// Input
{ "$var": ["user", "name"] }

// Output
"John" // Or whathever "user.name" is
```

Dynamic

```json
// Short notation
"${ user[foo] }"
// Expanded notation
{ "$var": ["user", { "$var": "foo" }] }

// Output
"John" // If `user` is { "name": "John" } and `foo` is "name"
```

The following will always be evaluated as their corresponding JSON values (and not as variables):

- `null`
- `true`
- `false`
- `undefined`

### String substitutions

```json
// Short notation
"Hello, ${ user.name }!"

// Expanded notation
{
  "$concat": ["Hello, ", { "$var": ["user", "name"] }, "!"]
}
```

Nullish values are ignored:

```js
// Short notation
"String${ 34 }${ null }${ false }${ true }"

// Expanded notation
{
  "$concat": ["String", 34, null, false, true]
}
// => "String34falsetrue"
```

Escaping

```json
"Hello, \\${ user.name }!"


// => "Hello, ${ user.name }!"
```

### Conditional

```json
{
  "$if": "${ some_condition }", // Any exprestion can be used here
  "$then": "True value",
  "$else": "False value"
}
```

Truhiness is evalued as follows:

- Values that resolve to `undefined` (unknown variables, invalid array indexes, etc.) are considered falsy
- `null`, `false`, `0` and `""` are considered falsy
- `[]` is considered truthy (use `[].length` to get falsy value for empty arrays)
- `{}` is considered truthy (use `"${{ { $for: {}, $do: 1 }.length }}"`)
- Any other value is considered truthy

Inline usage

```json
// Simple
"Hello, ${{ $if: show_name, $then: user.name, $else: 'Mister' }}!"

// Nested
"Hello, ${{ $if: show_name, $then: user.name, $else: { @if: is_male, @then: 'Mister', @else: "Miss" } }}!"
```

### Coalescing

```js
{
  "$coalesce": ["${ user.name }", "World"]
} // => "John" or "World" (depending on the value of user.name)
```

Inline usage:

```json
"Hello, ${{ $coalesce: [user.name, 'World'] }}!"
```

### Switch

```js
{
  "$swich": true,
  "$case": [
    ["${ foo }", "'foo' is true"],
    ["${ bar }", "'bar' is true ('foo' is not)"],
    ["${ baz }", "'baz' is true ('foo' and 'bar' are not)"]
  ],
  "$default": "Nothing is true"
}
```

### Local variables

```json
{
  "$declare": [
    {
      "world": "World",
      "foo": "'${ world }' is <undefined> in this scope!" // => { "foo": "'' is <undefined> in this scope" }
    },
    {
      "world_bis": "${ world }"
    }
  ],
  "$in": "Hello, ${ world_bis }!"
}


// => "Hello, World!"
```

### Custom functions

```json
{
  "$declare": [{ "$say_hello": "Hello, ${ $argv.to }!" }],
  "$in": { "$say_hello": { "to": "World" } }
}


// => "Hello, World!"
```

Advanced example

```json
{
  "$declare": [
    { "prefix": "Hello" },
    {
      "$say_hello": {
        "$declare": {
          "argv_with_defaults": { "$merge": [{ "to": "World" }, "${ $argv }"] }
        },
        "$in": {
          "$if": "${ argv_with_defaults.to }",
          "$then": "${prefix}, ${ argv_with_defaults.to }!",
          "$else": { "$say_hello": { "to": "World" } }
        }
      }
    },
    { "hello_world": { "$say_hello": { "to": "World" } } }
  ],
  "$in": { "$say_hello": { "to": 0 } }
}


// => "Hello, World!"
```

### Object creation

```json
{
  "$object": [
    ["\\${ foo }", "bar"],
    ["baz", "qux"]
  ]
}


// => { "${ foo }": "bar", "baz": "qux" }
```

Ignored entries:

- `null` and `undefined` keys

  ```json
  {
    "$object": [
      [null, "bar"],
      ["baz", "qux"],
      ["${ undefined }", "quux"]
    ]
  }


  // => { "baz": "qux" }
  ```

- `undefined` values (use `$coalesce` to provide a default value, including `null`)

  ```json
  {
    "$object": [
      ["foo", "${ undefined }"],
      ["bar", null],
      ["baz", { "@coalesce": ["${ undefined }", "qux"] }]
    ]
  }


  // => {"bar": null, "baz": "qux" }
  ```

### For loop

Loop over an existing array:

```json
{
  "$for": ["John", "Jane", "Joe"],
  "$do": "Hello, ${ $value }!"
}


// => ["Hello, John!", "Hello, Jane!", "Hello, Joe!"]
```

Loop over an existing object:

```json
{
  "$for": { "foo": "bar", "baz": "qux" },
  "$do": "Hello, ${ $value }!"
}


// => ["Hello, bar!", "Hello, qux!"]
```

Example: using object iteration to invert value and key:

```json
{
  "$object": {
    "$for": { "foo": "bar", "baz": "qux" },
    "$do": ["${ $value }", "${ $key }"]
  }
}


// => { "bar": "foo", "qux", "baz" }
```

> note: the order of the items is not guaranteed

Create an array from a length (the array will be filled with values that index + 1):

```json
{
  "$for": 2,
  "$do": "Item at index ${ $index } is ${ $value }!"
}


// => ["Item at index 0 is 1!", "Item at index 1 is 2!"]
```

## TODO

- [ ] Compile time bindings ([example](https://blog.devgenius.io/template-language-for-json-data-1831e2da554b))

## Related Work

- [json-template-engine](https://github.com/vmware/json-template-engine/blob/master/templating/README.md)
- [json-template-engine](https://www.npmjs.com/package/json-template-engine)
- [jsonette](https://jasonelle-archive.github.io/docs/legacy/templates/)
- [jeyson](https://www.npmjs.com/package/jeyson)
- [jso-ng](https://www.npmjs.com/package/jso-ng)
- [json-templates](https://www.npmjs.com/package/json-templates)
- [json-templater](https://www.npmjs.com/package/json-templater)
- [json-t](https://developers.squarespace.com/what-is-json-t)
- [jsonata](https://jsonata.org/)
- [jsonnet](https://jsonnet.org/)
