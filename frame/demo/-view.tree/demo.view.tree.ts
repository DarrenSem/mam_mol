namespace $ {
	export class $mol_frame_demo extends $mol_demo_large {
		
		/**
		 * ```tree
		 * sub / <= Frame
		 * ```
		 */
		sub() {
			return [
				this.Frame()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * Frame $mol_frame
		 * 	title @ \Another page inside that
		 * 	uri \https://mol.js.org/
		 * ```
		 */
		@ $mol_mem
		Frame() {
			const obj = new this.$.$mol_frame()
			
			obj.title = () => this.$.$mol_locale.text( '$mol_frame_demo_Frame_title' )
			obj.uri = () => "https://mol.js.org/"
			
			return obj
		}
	}
	
}

