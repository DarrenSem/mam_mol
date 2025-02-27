namespace $ {

	/** @FIXME Need polyfill for Safari and Node (https://github.com/microsoft/MSR-JavaScript-Crypto/) */
	const algorithm = {
		name: 'ECDSA',
		hash: 'SHA-256',
		namedCurve: "P-256",
	}
	
	/** Asymmetric signing pair with shortest payload */
	export async function $mol_crypto_auditor_pair( this: $ ) {
		
		const pair = await $mol_crypto_native.subtle.generateKey(
			algorithm,
			true,
			[ 'sign', 'verify' ]
		)
		
		return {
			
			public: new $mol_crypto_auditor_public(
				pair.publicKey as CryptoKey & { type: 'public' }
			),
			
			private: new $mol_crypto_auditor_private(
				pair.privateKey as CryptoKey & { type: 'private' }
			),
			
		}
		
	}
	
	/** Asymmetric signing public key wrapper with shortest payload */
	export class $mol_crypto_auditor_public extends Object {
		
		/** Key size in bytes. */
		static size = 86
		
		constructor(
			readonly native: CryptoKey & { type: 'public' }
		) {
			super()
		}
		
		static async from( serial: string ) {
			return new this(
				await $mol_crypto_native.subtle.importKey(
					'jwk',
					{
						crv: "P-256",
						ext: true,
						key_ops: ['verify'],
						kty: "EC",
						x: serial.slice( 0, 43 ),
						y: serial.slice( 43, 86 ),
					},
					algorithm,
					true,
					[ 'verify' ],
				) as CryptoKey & { type: 'public' }
			)
		}
		
		/** 62 bytes */
		async serial(): Promise< string > {
			const { x, y } = await $mol_crypto_native.subtle.exportKey(
				'jwk',
				this.native,
			)
			return x! + y!
		}
		
		async verify( data: BufferSource, sign: BufferSource ) {
			return await $mol_crypto_native.subtle.verify(
				algorithm,
				this.native,
				sign,
				data,
			)
		}
		
	}
	
	/** Asymmetric signing private key wrapper with shortest payload */
	export class $mol_crypto_auditor_private extends Object {
		
		/** Key size in bytes. */
		static size = 129
		
		constructor(
			readonly native: CryptoKey & { type: 'private' }
		) {
			super()
		}
	
		static async from( serial: string ) {
			return new this(
				await $mol_crypto_native.subtle.importKey(
					'jwk',
					{
						crv: "P-256",
						ext: true,
						key_ops: ['sign'],
						kty: "EC",
						x: serial.slice( 0, 43 ),
						y: serial.slice( 43, 86 ),
						d: serial.slice( 86, 129 ),
					},
					algorithm,
					true,
					[ 'sign' ],
				) as CryptoKey & { type: 'private' }
			)
		}
		
		/** 129 bytes */
		async serial(): Promise< string > {
			const { x, y, d } = await $mol_crypto_native.subtle.exportKey(
				'jwk',
				this.native,
			)
			return x! + y! + d!
		}
		
		/** 64 bytes */
		async sign( data: BufferSource ) {
			
			return await $mol_crypto_native.subtle.sign(
				algorithm,
				this.native,
				data
			)
			
		}
		
		/** Makes public key from private */
		async public() {
			return await $mol_crypto_auditor_public.from(
				$mol_crypto_auditor_private_to_public( await this.serial() )
			)
		}
		
	}
	
	/** Sign size in bytes. */
	export const $mol_crypto_auditor_sign_size = 64
	
	export function $mol_crypto_auditor_private_to_public( serial: string ) {
		return serial.slice( 0, 86 )
	}
	
}
