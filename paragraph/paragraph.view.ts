namespace $.$$ {

	export class $mol_paragraph extends $.$mol_paragraph {

		@ $mol_mem
		maximal_width() {

			let width = 0
			const letter = this.letter_width()
			
			for( const kid of this.sub() ) {
				
				if( !kid ) continue
				
				if( kid instanceof $mol_view ) {
					width += kid.maximal_width()
				} else if( typeof kid !== 'object' ) {
					width += String( kid ).length * letter
				}

			}
			
			return width

		}

		@ $mol_mem
		minimal_width() {
			return Math.max( Math.min( this.$.$mol_window.size().width , this.maximal_width() ) , this.letter_width() )
		}

		@ $mol_mem
		minimal_height() {
			return Math.max( 1 , Math.ceil( this.maximal_width() / this.minimal_width() ) ) * this.line_height()
		}

	}

}
