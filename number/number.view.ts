namespace $.$$ {
	export class $mol_number extends $.$mol_number {

		event_dec( next? : Event ) {
			this.value( ( Number( this.value() ) || 0 ) - this.precision_change() )
		}

		event_inc( next? : Event ) {
			this.value( ( Number( this.value() ) || 0 ) + this.precision_change() )
		}

		value_string( next? : string ) {
			if( next !== void 0 ) {
				this.value( next === '' ? null : Number( next ) )
			}

			const precisionView = this.precision_view()
			const value = next ? Number( next ) : this.value()

			if( value === 0 ) return '0'
			if( !value ) return ''

			if( precisionView >= 1 ) {
				return ( value / precisionView ).toFixed()
			} else {
				const fixedNumber = Math.log10( 1 / precisionView )
				return value.toFixed( fixedNumber )
			}
		}

	}
}
