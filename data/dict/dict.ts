namespace $ {

	export function $mol_data_dict< Sub extends $mol_data_value >( sub : Sub ) {

		return $mol_data_setup( ( val : Readonly< Record< string , ReturnType< Sub > > > ) => {
			
			if( Object.getPrototypeOf( val ) !== Object.prototype ) {
				return $mol_fail( new $mol_data_error( `${ val } is not an Object` ) )
			}

			const res = {}
			
			for( const field in val as Object ) {

				try {
					res[ field ] = sub( ( val as Object )[ field ] )
				} catch( error: any ) {

					if( error instanceof Promise ) return $mol_fail_hidden( error )
					
					error.message = `[${ JSON.stringify( field ) }] ${ error.message }`
					return $mol_fail( error )

				}

			}
			
			return res as Readonly< Record< string , ReturnType< Sub > > >
			
		} , sub )

	}
			
}
