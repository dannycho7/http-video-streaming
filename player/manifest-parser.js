class ManifestParser {
	constructor(video_id) {
		this.video_id = video_id;
	}

	adaptationSetToJSON(adaptationSet) {
		let adaptSetObj = {};

		adaptSetObj.mimeType = adaptationSet.getAttribute("mimeType");
		adaptSetObj.codecs = adaptationSet.getAttribute("codecs");

		adaptSetObj.representations = [];

		let representations = adaptationSet.children;

		for (let i = 0; i < representations.length; i++) {
			let representationObj = {};
			representationObj.url = `/${this.video_id}/${this.getUrl(representations[i])}`

			adaptSetObj.representations[i] = representationObj;
		}

		return adaptSetObj;
	}

	getUrl(representation) {
		let { children } = representation;
		for (let i = 0; children.length; i++) {
			if (children[i].tagName == "BaseURL") {
				return children[i].textContent;
			}
		}
	}

	getJSONManifest() {
		return new Promise((resolve, reject) => {
			fetch(`/${this.video_id}/manifest.mpd`)
			.then((response) => response.text())
			.then((manifest_str) => (new window.DOMParser()).parseFromString(manifest_str, "text/xml"))
			.then((manifest) => {
				let first_period = manifest.getElementsByTagName("Period")[0];
				let adaptationSets = first_period.children;

				window.manifest = manifest;

				let adaptSetsObj = {};
				for (let i = 0; i < adaptationSets.length; i++) {
					adaptSetsObj[adaptationSets[i].getAttribute("mimeType")] = this.adaptationSetToJSON(adaptationSets[i]);
				}

				resolve(adaptSetsObj);
			});
		});
	}
};

module.exports = ManifestParser;