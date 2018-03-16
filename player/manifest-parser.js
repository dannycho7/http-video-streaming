class ManifestParser {
	constructor(video_id) {
		this.video_id = video_id;
		this.base_video_url = "/watch";
	}

	adaptationSetToJSON(adaptationSet) {
		let adaptSetObj = {};

		adaptSetObj.mimeType = adaptationSet.getAttribute("mimeType");
		adaptSetObj.codecs = adaptationSet.getAttribute("codecs");

		adaptSetObj.representations = [];

		let representations = adaptationSet.children;

		let timestampPromises = [];

		for (let i = 0; i < representations.length; i++) {
			let representationObj = {};
			adaptSetObj.representations[i] = representationObj;
			representationObj["url"] = `${this.base_video_url}/${this.video_id}/${this.getUrl(representations[i])}`;

			let timestampPromise = new Promise((res, rej) => {
				fetch(`${this.base_video_url}/${this.video_id}/timestamps/${this.getUrl(representations[i])}.json`)
				.then((response) => response.json())
				.then((timestamp_info) => {
					representationObj["timestamp_info"] = timestamp_info;
					res();
				});
			});
			
			timestampPromises.push(timestampPromise);
		}

		return Promise.all(timestampPromises)
		.then(() => adaptSetObj);
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
			fetch(`${this.base_video_url}/${this.video_id}/manifest.mpd`)
			.then((response) => response.text())
			.then((manifest_str) => (new window.DOMParser()).parseFromString(manifest_str, "text/xml"))
			.then((manifest) => {
				let first_period = manifest.getElementsByTagName("Period")[0];
				let adaptationSets = first_period.children;

				window.manifest = manifest;

				let adaptationConversionPromises = [];

				let adaptSetsObj = {};
				for (let i = 0; i < adaptationSets.length; i++) {
					let adaptationPromise = new Promise((resAdapt, rejAdapt) => {
						this.adaptationSetToJSON(adaptationSets[i])
						.then((adaptation_json) => {
							adaptSetsObj[adaptationSets[i].getAttribute("mimeType")] = adaptation_json;
							resAdapt();
						});
					})
					adaptationConversionPromises.push(adaptationPromise);
				}

				Promise.all(adaptationConversionPromises)
				.then(() => resolve(adaptSetsObj));
			});
		});
	}
};

module.exports = ManifestParser;