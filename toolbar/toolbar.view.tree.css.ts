namespace $.$$ {

	const { rem , vh , per } = $mol_style_unit

	$mol_style_define( $mol_toolbar , {

		flex: {
			grow: 1,
			wrap: 'wrap',
			direction: 'row-reverse',
		},
		display: 'flex',
		position: 'relative',
		overflow: 'hidden',

		Bar: {
			display : 'flex',
			justifyContent: 'flex-end',
			flex: {
				grow: 1,
				shrink: 1,
				wrap: 'wrap',
			},
			margin: {
				right: rem(2.5),
			},
			minWidth: 0,
			maxHeight: rem(2.5),
			background: {
				color: $mol_theme.back,
			},
			boxShadow: `0 0 0 1px ${ $mol_theme.back }`,
		},

		Expand: {

			height: rem(2.5),
			margin: {
				top: rem(-2.5),
				left: rem(-2.5),
			},

			Icon: {
				transform: 'rotate(90deg)',
			},

		},
		
		'@': {
			mol_toolbar_expanded: {
				true: {

					Bar: {
						maxHeight: vh(100),
					},
					
					Expand: {

						Icon: {
							transform: 'rotate(270deg)',
						},
			
					},
			
				},
			},
		},
		
	} )

}
