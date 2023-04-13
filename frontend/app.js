const imageComparator = {
    bucketName: "analyze-example-com",
    apiEndpoint: 'https://analyze.example.com/api/v1',
    apiToken: "Change Me eKdWpDnw",

    init: async function () {
        document.getElementById('previousImage').addEventListener('click', this.previousImage.bind(this));
        document.getElementById('nextImage').addEventListener('click', this.nextImage.bind(this));
        document.getElementById('deleteLatest').addEventListener('click', this.deleteLatest.bind(this));

        this.images = await this.listBucketImages();
        this.index = 0
        console.log(this.images, this.images.length);
        if (this.images.length > 0) {
            this.mediaLink1 = this.images[this.index].generations[this.images.length - 2].mediaLink;
            this.mediaLink2 = this.images[this.index].generations[this.images.length - 1].mediaLink;
            this.compareImages();
        }
    },

    loadImage: function (src) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    },

    setSubtitle: async function () {
        console.log(this.images[this.index].name);
        document.getElementById('subtitle').textContent = this.images[this.index].name;
    },

    compareImages: async function () {
        let img1 = await this.loadImage(this.mediaLink1);
        let img2 = await this.loadImage(this.mediaLink2);

        let mat1 = cv.imread(img1);
        let mat2 = cv.imread(img2);

        if (mat1.size().width !== mat2.size().width || mat1.size().height !== mat2.size().height) {
            alert('Images must have the same dimensions');
            return;
        }

        let result = new cv.Mat();
        cv.absdiff(mat1, mat2, result);
        cv.cvtColor(result, result, cv.COLOR_RGBA2GRAY);
        cv.threshold(result, result, 30, 255, cv.THRESH_BINARY);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(result, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        cv.cvtColor(mat1, mat1, cv.COLOR_RGBA2RGB);

        let color = new cv.Scalar(0, 255, 0);
        let thickness = 5;

        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            let rect = cv.boundingRect(cnt);
            let topLeft = new cv.Point(rect.x, rect.y);
            let bottomRight = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            cv.rectangle(mat1, topLeft, bottomRight, color, thickness);
            cv.rectangle(mat2, topLeft, bottomRight, color, thickness);
        }

        let canvas1 = document.getElementById('resultCanvas1');
        let canvas2 = document.getElementById('resultCanvas2');

        // Set canvas dimensions to match the image dimensions
        canvas1.width = mat1.cols;
        canvas1.height = mat1.rows;
        canvas2.width = mat2.cols;
        canvas2.height = mat2.rows;

        cv.imshow(canvas1, mat1);
        cv.imshow(canvas2, mat2);

        mat1.delete();
        mat2.delete();
        result.delete();
        contours.delete();
        hierarchy.delete();

        this.setSubtitle();
    },

    listBucketImages: async function () {
        const apiUrl = `https://storage.googleapis.com/storage/v1/b/${this.bucketName}/o?versions=true`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            return data.items.reduce((grouped, item) => {
                const index = grouped.findIndex(group => group.name === item.name);
            
                if (index === -1) {
                    grouped.push({
                        name: item.name,
                        generations: [
                            {
                                generation: item.generation,
                                mediaLink: item.mediaLink,
                            },
                        ],
                    });
                } else {
                    grouped[index].generations.push({
                        generation: item.generation,
                        mediaLink: item.mediaLink,
                    });
                }
            
                return grouped;
            }, []);
        } catch (error) {
            console.error("Error fetching bucket images:", error);
            return [];
        }
    },

    previousImage: async function () {
        this.index = (this.index - 1) % this.images.length;
        this.mediaLink1 = this.images[this.index].generations[this.images.length - 2].mediaLink;
        this.mediaLink2 = this.images[this.index].generations[this.images.length - 1].mediaLink;
        this.compareImages();
    },

    nextImage: async function () {
        this.index = (this.index + 1) % this.images.length;
        this.mediaLink1 = this.images[this.index].generations[this.images.length - 2].mediaLink;
        this.mediaLink2 = this.images[this.index].generations[this.images.length - 1].mediaLink;
        this.compareImages();
    },

    deleteLatest: async function () {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Token': this.apiToken,
                },
                body: JSON.stringify({
                    bucketName: this.bucketName,
                    objectName: this.images[this.index].name,
                }),
            });
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    },
}