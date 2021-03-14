namespace $ {
	
	/** Types that can be stored in the CROWD Unordered Set */
	export type $mol_crowd_set_key = string | number
	
	/** JSON representation of CROWD Unordered Set */
	export type $mol_crowd_set_data = readonly( readonly[ $mol_crowd_set_key, number ] )[]
	
	/** CROWD Unordered Set */
	export class $mol_crowd_set extends $mol_crowd_store< $mol_crowd_set_data > {
		
		protected readonly stamps = new Map< $mol_crowd_set_key, number >()
		
		get items() {
			return new Set(
				this.toJSON()
				.filter( ([ key, stamp ])=> stamp > 0 )
				.map( ([ key ])=> key )
			)
		}
		
		has( val: $mol_crowd_set_key ) {
			return this.stamps.get( val )! > 0
		}
		
		version_item( val: $mol_crowd_set_key ) {
			return Math.abs( this.stamps.get( val ) ?? 0 )
		}
		
		toJSON( version_min = 0 ) {
			return [ ... this.stamps.entries() ]
			.filter( ([ key, stamp ])=> Math.abs( stamp ) > version_min )
			.sort( ( a, b )=> Math.abs( a[1] ) - Math.abs( b[1] ) ) as $mol_crowd_set_data
		}
		
		add(
			key: $mol_crowd_set_key,
		) {
			this.apply([[ key, this.stamper.genegate() ]])
			return this
		}
		
		remove(
			key: $mol_crowd_set_key
		) {
			this.apply([[ key, - this.stamper.genegate() ]])
			return this
		}
		
		apply(
			data: $mol_crowd_set_data,
		) {
			
			for( let [ key, stamp ] of data ) {
				
				const version = Math.abs( stamp )
				if( this.version_item( key ) >= version ) continue
				
				this.stamps.set( key, stamp )
				this.stamper.feed( version )
				
			}
			
			return this
		}
		
	}
	
}
