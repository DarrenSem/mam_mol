namespace $.$$ {
	
	export class $mol_link extends $.$mol_link {
		
		@ $mol_mem
		uri() {
			
			const arg = this.arg()
			
			const uri = new this.$.$mol_state_arg( this.state_key() ).link( arg )
			if( uri !== this.$.$mol_state_arg.href() ) return uri
			
			const arg2 = {}
			for( let i in arg ) arg2[i] = null
			
			return new this.$.$mol_state_arg( this.state_key() ).link( arg2 )
		}
		
		@ $mol_mem
		uri_native() {
			const base = this.$.$mol_state_arg.href()
			return new URL( this.uri() , base )
		}

		@ $mol_mem
		current() {

			const base = this.$.$mol_state_arg.href()
			const target = this.uri_native().toString()

			if( base === target ) return true
			
			const args = this.arg()
			
			const keys = Object.keys( args ).filter( key => args[ key ] != null )
			if( keys.length === 0 ) return false

			for( const key of keys ) {
				if( this.$.$mol_state_arg.value( key ) !== args[ key ] ) return false
			}

			return true
		}

		event_click( event? : Event ) {
			if( !event || event.defaultPrevented ) return
			this.focused( false )
			// setTimeout( $mol_log_group( `${ this }.event_click()` , ()=> this.focused( false ) ) , 50 )
		}

		file_name() {
			return null as unknown as string
		}

		minimal_height() {
			return Math.max( super.minimal_height(), 40 )
		}
		
		target() {
			return ( this.uri_native().origin === $mol_dom_context.location.origin ) ? '_self' : '_blank'
		}

	}
	
}
