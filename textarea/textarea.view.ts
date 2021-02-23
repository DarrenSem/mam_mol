namespace $.$$ {

	export class $mol_textarea extends $.$mol_textarea {

		indent_inc() {

			document.execCommand( 'insertText', false, '\t' )
			
			// const el = this.Edit().dom_node() as HTMLTextAreaElement
			// const pos = el.selectionStart

			// let text = this.value()
			// text = text.substring( 0 , pos ) + '\t' + text.substring( el.selectionEnd )

			// this.value( text )
			// el.value = text
			// el.selectionStart = el.selectionEnd = pos + 1
		}

		indent_dec() {

		}
		
		hover( event : PointerEvent ) {
			this.clickable( event.ctrlKey )
		}
		
		press( event : KeyboardEvent ) {

			switch( event.keyCode ) {
				case $mol_keyboard_code.tab : this.indent_inc() ; break
				case event.shiftKey && $mol_keyboard_code.tab : this.indent_dec() ; break
				default : return
			}

			event.preventDefault()

		}

	}

}
