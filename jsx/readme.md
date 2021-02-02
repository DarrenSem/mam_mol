# $mol_jsx

JSX adapter that makes DOM tree. Generates global uniue ids for every dom-element by components tree with ids. Ensures all local ids are unique. Can reuse an existing nodes by guids when used inside [`$mol_jsx_attach`](./attach).

## Usage example

```tsx
/** @jsx $mol_jsx */

const $my_message = ( props : { content : string } )=> (
	<div classList={[ 'foo bar' ]} >
		{ props.content } is
		<strong id="/text_nodes" >
			text nodes
		</strong>
		mixed with
		<strong id="/elements" >
			elements
		</strong>
		!
	</div>
)

const dom = (
	<html>
		<body>
			<$my_message id="$my_app" content="Content" />
		</body>
	</html>
)
```

Result:

```html
<html>
	<body>
		<div id="$my_app" class="foo bar" >
			Content is
			<strong id="$my_app/text_nodes" >
				text nodes
			</strong>
			mixed with
			<strong id="$my_app/elements" >
				elements
			</strong>
			!
		</div>
	</body>
</html>
```

[More examples in tests.](jsx.test.tsx)

# See also

- [$mol_jsx_attach](attach) - render JSX to existing document
- [$mol_jsx_view](view) - statefull view bound to dom-element
