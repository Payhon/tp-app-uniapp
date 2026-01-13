import 'vue'

declare module 'vue' {
	interface ComponentCustomProperties {
		$img: (keyOrPath: string) => string
	}
}

