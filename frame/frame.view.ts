namespace $.$$ {
	export class $mol_frame extends $.$mol_frame {
		
		window() {
			// if( this.html() ) return ( this.dom_node() as HTMLIFrameElement ).contentWindow!
			return super.window()
		}

		allow() {
			return [
				... this.fullscreen() ? [ 'fullscreen' ] : [] ,
				... this.accelerometer() ? [ 'accelerometer' ] : [] ,
				... this.autoplay() ? [ 'autoplay' ] : [] ,
				... this.encription() ? [ 'encrypted-media' ] : [] ,
				... this.gyroscope() ? [ 'gyroscope' ] : [] ,
				... this.pip() ? [ 'picture-in-picture' ] : [] ,
			].join(';')
		}
		
	}
}
