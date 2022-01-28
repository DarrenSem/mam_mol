namespace $ {
	
	/**
	 * Publisher that can auto collect other publishers. 32B
	 * 
	 * 	P1 P2 P3 P4 S1 S2 S3
	 * 	^           ^
	 * 	pubs_from   subs_from
	 */
	export class $mol_wire_pub_sub extends $mol_wire_pub implements $mol_wire_sub {
		
		protected pub_from = 0 // 4B
		protected cursor = $mol_wire_cursor.stale // 4B
		
		get pub_list() {
			const res = [] as $mol_wire_pub[]
			for( let i = this.pub_from; i < this.sub_from; i += 2 ) {
				res.push( this[i] as $mol_wire_pub )
			}
			return res
		}
		
		track_on() {
			this.cursor = this.pub_from
			const sub = $mol_wire_auto
			$mol_wire_auto = this
			return sub
		}
		
		track_promote() {
			
			if( this.cursor >= this.pub_from ) {
				$mol_fail( new Error( 'Circular subscription' ) )
			}
			
			super.track_promote()
		}
		
		track_next( pub?: $mol_wire_pub ): $mol_wire_pub | null {
			
			if( this.cursor < 0 ) $mol_fail( new Error( 'Promo to non begun sub' ) )
			
			if( this.cursor < this.sub_from ) {
			
 				const next = this[ this.cursor ] as $mol_wire_pub | undefined
				if( pub === undefined ) return next ?? null
				
				if( next === pub ) {
					this.cursor += 2
					return next
				}
				
				next?.sub_off( this[ this.cursor + 1 ] as number )
				
			} else {
				
				if( pub === undefined ) return null
				
				if( this.sub_from < this.length ) {
					this.peer_move( this.sub_from, this.length )
				}
				
				this.sub_from += 2
				
			}			
			
			this[ this.cursor ] = pub
			this[ this.cursor + 1 ] = pub.sub_on( this, this.cursor )
			
			this.cursor += 2
			
			return pub
		}
		
		track_off( sub: $mol_wire_sub | null ) {
			
			$mol_wire_auto = sub
			
			if( this.cursor < 0 ) $mol_fail( new Error( 'End of non begun sub' ) )
			
			this.forget( this.cursor )
			
			for(
				let cursor = this.pub_from;
				cursor < this.sub_from;
				cursor += 2
			) {
				const pub = this[ cursor ] as $mol_wire_pub
				pub.up()
			}
			
			this.cursor = $mol_wire_cursor.fresh
			
		}
		
		pub_off( sub_pos: number ) {
			this[ sub_pos ] = undefined as any
			this[ sub_pos + 1 ] = undefined as any 
		}
		
		destructor() {
			
			for(
				let cursor = this.length - 2;
				cursor >= this.sub_from;
				cursor -= 2
			) {
				const sub = this[ cursor ] as $mol_wire_sub
				const pos = this[ cursor + 1 ] as number
				sub.pub_off( pos )
				this.pop()
				this.pop()
			}
			
			this.forget()
			this.cursor = $mol_wire_cursor.final
			
		}
		
		forget( from = this.pub_from ) {
			
			let tail = 0
			
			for(
				let cursor = from;
				cursor < this.sub_from;
				cursor += 2
			) {
				
				const pub = this[ cursor ] as $mol_wire_pub | undefined
				pub?.sub_off( this[ cursor + 1 ] as number )
				
				if( this.sub_from < this.length ) {
					this.peer_move( this.length - 2, cursor )
					this.pop()
					this.pop()
				} else {
					++ tail
				}
				
			}
			
			for(; tail; -- tail ) {
				this.pop()
				this.pop()
			}
			
			this.sub_from = from
			
		}

		affect( quant: number ) {
			
			if( this.cursor === $mol_wire_cursor.final ) return false
			if( this.cursor >= quant ) return false
			this.cursor = quant
			
			return super.affect( quant )
		}
		
		[ $mol_dev_format_head ]() {
			return $mol_dev_format_native( this )
		}
		
		/**
		 * Is subscribed to any publisher or not.
		 */
		get pub_empty() {
			return this.sub_from === this.pub_from
		}
		
	}
	
}
