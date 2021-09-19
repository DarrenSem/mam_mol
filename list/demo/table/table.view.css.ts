namespace $.$$ {

	const { rem } = $mol_style_unit
	
	$mol_style_define( $mol_list_demo_table , {

		Row: {

			padding: 0,
			// boxShadow: `0 0 0 .5px ${ $mol_theme.line }`,

			'>': {
				
				$mol_view: {
					margin: 0,
				},

			},

		},

		Id: {
			justifyContent: 'flex-end',
			padding: $mol_gap.text,
			flex: {
				grow: 0,
				shrink: 0,
				basis: rem(4),
			},
		},
		
		Title: {
			fontWeight: 'bolder',
			flex: {
				grow: 1,
				shrink: 1,
				basis: rem(10),
			},
			padding: $mol_gap.text,
		},
		
		Link: {
			flex: {
				grow: 1,
				shrink: 1,
				basis: rem(3),
			},
		},

		Editable: {
			Title: {
				verticalAlign: 'top',
			},
		},

		Priority: {
			flex: 'none',
		},

	})

}
