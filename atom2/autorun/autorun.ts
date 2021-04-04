namespace $ {

	export function $mol_atom2_autorun( calculate : ()=> any ) {
		
		return $mol_atom2.create( atom => {
			
			atom.calculate = calculate
			atom.obsolete_slaves = atom.schedule
			atom.doubt_slaves = atom.schedule
			
			if( Symbol.toStringTag in calculate ) {
				atom[ Symbol.toStringTag ] = calculate[ Symbol.toStringTag ]
			} else {
				atom[ Symbol.toStringTag ] = calculate.name || '$mol_atom2_autorun'
			}
			
			atom.schedule()
			
		} )

	}

}
