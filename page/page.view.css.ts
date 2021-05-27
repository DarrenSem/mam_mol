namespace $.$$ {

	const { per , rem } = $mol_style_unit

	$mol_style_define( $mol_page , {

		display: 'flex' ,
		margin: 0 ,
		flex: {
			basis: 'auto' ,
			direction: 'column' ,
		},
		position: 'relative' ,
		alignSelf: 'stretch' ,
		maxWidth: per(100) ,
		maxHeight: per(100) ,
		boxSizing: 'border-box' ,
		background: {
			color: $mol_theme.back ,
		},
		color: $mol_theme.text ,
		// zIndex: 0 ,

		':focus': {
			outline: 'none',
		} ,

		Head: {
			display: 'flex' ,
			flexWrap: 'wrap' ,
			justifyContent: 'flex-end' ,
			flex: 'none',
			position: 'relative' ,
			margin: 0 ,
			minHeight: rem(4),
			padding: $mol_gap.block ,
			background: {
				color: $mol_theme.back ,
			},
			boxShadow: `0 0.5rem 0.5rem -0.5rem hsla(0,0%,0%,.25)` ,
			// zIndex: 1,
		},

		Title: {

			minHeight: rem(2),
			margin: 0,
			padding: $mol_gap.text,
			wordBreak: 'normal',
			textShadow: '0 0',

			font: {
				size: 'inherit',
				weight: 'normal',
			},
	
			flex: {
				grow: 1000,
				shrink: 1,
				basis: per(50),
			},

		},

		Tools: {
			
			flex: {
				basis: 'auto',
				grow: 0,
				shrink: 1,
			},
			display: 'flex',
			justifyContent: 'flex-end',
			alignItems: 'flex-start',
			flexWrap: 'wrap',

		},

		Body: {
			flex: {
				grow: 1000,
				shrink: 1,
				basis: per(100),
			},
			margin: 0,
			padding: $mol_gap.block,
		},

		Foot: {
			display: 'flex',
			justifyContent: 'space-between',
			flex: 'none',
			margin: 0,
			overflow: 'hidden',
			background: {
				color: $mol_theme.back ,
			},
			boxShadow: `0 -0.5rem 0.5rem -0.5rem hsla(0,0%,0%,.25)` ,
			zIndex: 1,
		},	

	} )
	
}
