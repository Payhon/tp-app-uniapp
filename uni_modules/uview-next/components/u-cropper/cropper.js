/**
 * 图片裁剪核心库 - View显示版本
 * 使用view和image显示界面，只在导出时使用canvas
 * 支持H5、App、微信小程序、支付宝小程序、抖音小程序
 */

export default class ImageCropper {
    constructor(context,options) {

        this.context = context;
        this.options = options || {};
        
        this.canvasId = options.canvasId;
        this.fileType = options.fileType || 'jpg';
        this.quality = options.quality || 0.8;

        const { windowWidth, windowHeight } = uni.$u.window();

        // 画布尺寸（显示区域）
        this.canvasWidth = options.canvasWidth || windowWidth;
        this.canvasHeight = options.canvasHeight || windowHeight;
        
        // 输出图片配置
        this.width = options.width || 400;
        this.height = options.height || 400;

        // 裁剪框配置
        this.rectWidth = options.rectWidth || 400;
        this.rectHeight = options.rectHeight || 400;
        
        // 图片数据
        this.imgData = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            scale: 1,
            angle: 0,
            originalWidth: 0,
            originalHeight: 0,
            src: ''
        };
        
        // 触摸数据
        this.touch = {
            startX: 0,
            startY: 0,
            startDistance: 0,
            startScale: 1,
            isTouch: false,
            isMove: false,
            isScaling: false
        };
        
        // 图片加载状态
        this.imageLoaded = false;
        
        // 回调函数
        this.onUpdate = options.onUpdate || (() => {});
        this.triggerUpdate();
    }

    normalizeImageSrc(src) {
        let nextSrc = String(src || '').trim();
        if (!nextSrc) return '';

        // #ifdef APP-PLUS
        try {
            if (nextSrc.startsWith('file://')) {
                nextSrc = decodeURI(nextSrc.replace(/^file:\/\//i, ''));
            } else if (
                nextSrc.startsWith('_doc/') ||
                nextSrc.startsWith('_downloads/') ||
                nextSrc.startsWith('_www/')
            ) {
                nextSrc = plus.io.convertLocalFileSystemURL(nextSrc);
            }
        } catch (e) {}
        // #endif

        return nextSrc;
    }

    // 设置图片源
    setImage(src) {
        return new Promise((resolve, reject) => {
            const normalizedSrc = this.normalizeImageSrc(src);
            if (!normalizedSrc) {
                reject(new Error('图片路径不能为空'));
                return;
            }
            
            uni.getImageInfo({
                src: normalizedSrc,
                success: (res) => {
                    this.imgData.src = normalizedSrc;
                    this.imgData.originalWidth = res.width;
                    this.imgData.originalHeight = res.height;
                    this.imageLoaded = true;
                    this.resetImageData();
                    this.triggerUpdate();
                    resolve(res);
                },
                fail: () => reject(new Error('图片信息获取失败'))
            });
        });
    }

    // 重置图片数据
    resetImageData() {
        if (!this.imageLoaded) return;
        
        const imgWidth = this.imgData.originalWidth;
        const imgHeight = this.imgData.originalHeight;
        
        // 计算让图片宽度或高度等于裁剪框尺寸的缩放比例
        const scaleX = this.rectWidth / imgWidth;
        const scaleY = this.rectHeight / imgHeight;
        // 使用较大的缩放比例，确保图片至少有一边等于裁剪框尺寸
        const scale = Math.max(scaleX, scaleY);
        
        // 计算裁剪框在画布中的居中位置
        const rectX = (this.canvasWidth - this.rectWidth) / 2;
        const rectY = (this.canvasHeight - this.rectHeight) / 2;
        
        // 保持当前的旋转角度
        const currentAngle = this.imgData.angle || 0;
        
        this.imgData = {
            ...this.imgData,
            x: rectX + (this.rectWidth - imgWidth * scale) / 2,
            y: rectY + (this.rectHeight - imgHeight * scale) / 2,
            width: imgWidth * scale,
            height: imgHeight * scale,
            scale: scale,
            angle: currentAngle
        };
        
        // 如果图片有旋转，需要重新计算边界限制
        if (currentAngle !== 0) {
            this.applyBoundaryConstraints();
        }
    }

    // 应用边界约束
    applyBoundaryConstraints() {
        // 计算裁剪框在画布中的居中位置
        const rectX = (this.canvasWidth - this.rectWidth) / 2;
        const rectY = (this.canvasHeight - this.rectHeight) / 2;
        
        // 获取旋转后的边界框
        const rotatedBounds = this.getRotatedBounds();
        
        // 计算图片中心点相对于裁剪框的偏移范围
        const maxOffsetX = Math.max(0, (rotatedBounds.width - this.rectWidth) / 2);
        const maxOffsetY = Math.max(0, (rotatedBounds.height - this.rectHeight) / 2);
        
        // 裁剪框中心点
        const rectCenterX = rectX + this.rectWidth / 2;
        const rectCenterY = rectY + this.rectHeight / 2;
        
        // 当前图片中心点
        const imgCenterX = this.imgData.x + this.imgData.width / 2;
        const imgCenterY = this.imgData.y + this.imgData.height / 2;
        
        // 限制图片中心点的移动范围
        const limitedCenterX = Math.max(rectCenterX - maxOffsetX, Math.min(rectCenterX + maxOffsetX, imgCenterX));
        const limitedCenterY = Math.max(rectCenterY - maxOffsetY, Math.min(rectCenterY + maxOffsetY, imgCenterY));
        
        // 重新计算图片位置
        this.imgData.x = limitedCenterX - this.imgData.width / 2;
        this.imgData.y = limitedCenterY - this.imgData.height / 2;
    }

    // 计算旋转后图片的边界框
    getRotatedBounds() {
        const { width, height, angle } = this.imgData;
        
        if (angle === 0 || angle % 360 === 0) {
            return { width, height };
        }
        
        // 将角度转换为弧度
        const rad = (angle * Math.PI) / 180;
        
        // 计算旋转后的边界框
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        const rotatedWidth = width * cos + height * sin;
        const rotatedHeight = width * sin + height * cos;
        
        return {
            width: rotatedWidth,
            height: rotatedHeight
        };
    }

    // 触摸开始
    touchStart(e) {
        if (!this.imageLoaded) return;

        const touches = e.touches || [];
        if (touches.length >= 2) {
            const distance = this.getTouchDistance(touches[0], touches[1]);
            this.touch.startDistance = distance;
            this.touch.startScale = this.imgData.scale;
            this.touch.isTouch = true;
            this.touch.isScaling = true;
            this.touch.isMove = false;
            return;
        }

        const x = touches.length ? touches[0].clientX : e.clientX;
        const y = touches.length ? touches[0].clientY : e.clientY;

        this.touch.startX = x;
        this.touch.startY = y;
        this.touch.startDistance = 0;
        this.touch.startScale = this.imgData.scale;
        this.touch.isTouch = true;
        this.touch.isScaling = false;
        this.touch.isMove = false;
    }

    // 触摸移动
    touchMove(e) {
        if (!this.touch.isTouch || !this.imageLoaded) return;
        
        e.preventDefault && e.preventDefault();
        
        const touches = e.touches || [];
        if (touches.length >= 2) {
            const distance = this.getTouchDistance(touches[0], touches[1]);
            if (!distance || !this.touch.startDistance) return;
            const centerX = (touches[0].clientX + touches[1].clientX) / 2;
            const centerY = (touches[0].clientY + touches[1].clientY) / 2;
            const ratio = distance / this.touch.startDistance;
            this.applyScale(this.touch.startScale * ratio, centerX, centerY);
            this.touch.isScaling = true;
            this.touch.isMove = true;
            return;
        }

        const x = touches.length ? touches[0].clientX : e.clientX;
        const y = touches.length ? touches[0].clientY : e.clientY;
        
        // 单点拖拽
        const deltaX = x - this.touch.startX;
        const deltaY = y - this.touch.startY;
        
        // 计算新的图片位置
        let newX = this.imgData.x + deltaX;
        let newY = this.imgData.y + deltaY;
        
        // 计算裁剪框在画布中的居中位置
        const rectX = (this.canvasWidth - this.rectWidth) / 2;
        const rectY = (this.canvasHeight - this.rectHeight) / 2;
        
        // 获取旋转后的边界框
        const rotatedBounds = this.getRotatedBounds();
        
        // 计算图片中心点相对于裁剪框的偏移范围
        const maxOffsetX = Math.max(0, (rotatedBounds.width - this.rectWidth) / 2);
        const maxOffsetY = Math.max(0, (rotatedBounds.height - this.rectHeight) / 2);
        
        // 裁剪框中心点
        const rectCenterX = rectX + this.rectWidth / 2;
        const rectCenterY = rectY + this.rectHeight / 2;
        
        // 限制图片中心点的移动范围
        const imgCenterX = newX + this.imgData.width / 2;
        const imgCenterY = newY + this.imgData.height / 2;
        
        const limitedCenterX = Math.max(rectCenterX - maxOffsetX, Math.min(rectCenterX + maxOffsetX, imgCenterX));
        const limitedCenterY = Math.max(rectCenterY - maxOffsetY, Math.min(rectCenterY + maxOffsetY, imgCenterY));
        
        // 重新计算图片位置
        newX = limitedCenterX - this.imgData.width / 2;
        newY = limitedCenterY - this.imgData.height / 2;
        
        this.imgData.x = newX;
        this.imgData.y = newY;
        
        this.touch.startX = x;
        this.touch.startY = y;
        this.touch.isMove = true;
        
        this.triggerUpdate();
    }

    // 触摸结束
    touchEnd(e) {
        this.touch.isTouch = false;
        this.touch.isMove = false;
        this.touch.isScaling = false;
        this.touch.startDistance = 0;
        this.touch.startScale = this.imgData.scale;
    }

    // 缩放图片
    scaleImage(ratio) {
        if (!this.imageLoaded) return;

        this.applyScale(this.imgData.scale * ratio);
    }

    getMinScale() {
        const minScaleX = this.rectWidth / this.imgData.originalWidth;
        const minScaleY = this.rectHeight / this.imgData.originalHeight;
        return Math.max(minScaleX, minScaleY);
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    applyScale(nextScale, focusX, focusY) {
        if (!this.imageLoaded) return;

        const minScale = this.getMinScale();
        const clampedScale = Math.max(minScale, Math.min(3, nextScale));
        if (!Number.isFinite(clampedScale) || clampedScale <= 0) return;
        if (Math.abs(clampedScale - this.imgData.scale) < 0.0001) return;

        // 计算新的尺寸
        const newWidth = this.imgData.originalWidth * clampedScale;
        const newHeight = this.imgData.originalHeight * clampedScale;

        const anchorX = Number.isFinite(focusX) ? focusX : this.imgData.x + this.imgData.width / 2;
        const anchorY = Number.isFinite(focusY) ? focusY : this.imgData.y + this.imgData.height / 2;

        const relativeX = this.imgData.width ? (anchorX - this.imgData.x) / this.imgData.width : 0.5;
        const relativeY = this.imgData.height ? (anchorY - this.imgData.y) / this.imgData.height : 0.5;

        this.imgData.scale = clampedScale;
        this.imgData.width = newWidth;
        this.imgData.height = newHeight;
        this.imgData.x = anchorX - relativeX * newWidth;
        this.imgData.y = anchorY - relativeY * newHeight;

        // 应用边界约束
        this.applyBoundaryConstraints();
        this.triggerUpdate();
    }

    // 旋转图片
    rotate(angle = 90) {
        if (!this.imageLoaded) return;
        
        this.imgData.angle += angle;
        
        // 旋转后应用边界约束
        this.applyBoundaryConstraints();
        this.triggerUpdate();
    }

    // 重置图片
    reset() {
        this.resetImageData();
        this.triggerUpdate();
    }
    
    loadImage(canvas,src) {
        return new Promise( (resolve, reject) => {
            if (this.options.type == '2d') {
                var img = canvas.createImage();
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = (e) => {
                    reject(e);
                };
                img.src = src;
            } else {
                resolve(src);
            }
        })
    }

    canvasToTempFilePath(resolve, reject, canvas) {
        let params = {
            canvas: canvas,
            canvasId: this.canvasId,
            fileType: this.fileType,
            quality: this.quality,
            width: this.width,
            height: this.height,
            success: (res) => {
                resolve(res.tempFilePath)
            },
            fail: (err) => {
                console.error('导出图片失败:', err);
                reject(err);
            }
        };
        // #ifdef MP-ALIPAY
        uni.canvasToTempFilePath(params);
        // #endif
        // #ifndef MP-ALIPAY
        uni.canvasToTempFilePath(params, this.context);
        // #endif
    }
    
    // 导出裁剪图片
    getCropperImage() {

        return new Promise(async (resolve, reject) => {
            if (!this.imageLoaded) {
                reject(new Error('图片未加载'));
                return;
            }
            
            // 计算裁剪框在画布中的居中位置
            const rectX = (this.canvasWidth - this.rectWidth) / 2;
            const rectY = (this.canvasHeight - this.rectHeight) / 2;
            
            // 计算图片在裁剪框中的相对位置
            const imgX = this.imgData.x - rectX;
            const imgY = this.imgData.y - rectY;

            // 计算缩放比例 - 导出图片尺寸 vs 裁剪框尺寸
            const scaleX = this.width / this.rectWidth;
            const scaleY = this.height / this.rectHeight;

            let canvas = null;
            // #ifdef MP-ALIPAY
            let ctx = uni.createCanvasContext(this.canvasId);
            // #endif
            // #ifndef MP-ALIPAY
            let ctx = uni.createCanvasContext(this.canvasId, this.context);
            // #endif

            if(this.options.type == '2d'){
                canvas = await new Promise(resolve => {
                    uni.createSelectorQuery()
                        .in(this.context)
                        .select(`#${this.canvasId}`)
                        .fields({
                            node: true,
                            size: true
                        })
                        .exec(res => {
                            resolve(res[0].node);
                        });
                });
                
                canvas.width = this.width;
                canvas.height = this.height;

                ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, this.width, this.height);

            }else{
                // 清空画布
                ctx.clearRect(0, 0, this.width, this.height);
            }
            
            const image = await this.loadImage(canvas,this.imgData.src);

            // 计算缩放后的图片位置和尺寸
            const scaledImgX = imgX * scaleX;
            const scaledImgY = imgY * scaleY;
            const scaledImgWidth = this.imgData.width * scaleX;
            const scaledImgHeight = this.imgData.height * scaleY;

            // 绘制图片
            if (this.imgData.angle == 0) {
                ctx.drawImage(image, scaledImgX, scaledImgY, scaledImgWidth, scaledImgHeight);
            } else {
                ctx.save();
                ctx.translate(scaledImgX + scaledImgWidth / 2, scaledImgY + scaledImgHeight / 2);
                ctx.rotate((this.imgData.angle * Math.PI) / 180);
                ctx.drawImage(image, -scaledImgWidth / 2, -scaledImgHeight / 2, scaledImgWidth, scaledImgHeight);
                ctx.restore();
            }
          
            if(this.options.watermark && this.options.watermark.text) {
                const text = this.options.watermark.text;
                const fontSize = parseInt(this.options.watermark.fontSize) || 18;
                const fontFamily = this.options.watermark.fontFamily || 'Arial';
                const color = this.options.watermark.color || 'rgba(0, 0, 0, 0.2)';
                const rotate = this.options.watermark.rotate || -30;
                const spacing = this.options.watermark.spacing || 100;
                const single = this.options.watermark.single || false;
                const bold = this.options.watermark.bold || false;

                // 设置水印样式
                ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (single) {
                    // 绘制单个居中水印
                    const centerX = this.width / 2;
                    const centerY = this.height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotate * Math.PI) / 180);
                    ctx.fillText(text, 0, 0);
                } else {
                    // 绘制网格水印
                    const cols = Math.ceil(this.width / spacing) + 1;
                    const rows = Math.ceil(this.height / spacing) + 1;

                    // 绘制水印网格
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            const x = col * spacing;
                            const y = row * spacing;
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate((rotate * Math.PI) / 180);
                            ctx.fillText(text, 0, 0);
                            ctx.restore();
                        }
                    }
                }
            }
            
            if(this.options.type == '2d') {
                this.canvasToTempFilePath(resolve, reject, canvas);
            }else{
                ctx.draw(false, ()=>{
                    this.canvasToTempFilePath(resolve, reject);
                });
            }
        });
    }

    // 触发更新回调
    triggerUpdate() {
        this.onUpdate({
            imageLoaded: this.imageLoaded,
            imageSrc: this.imgData.src,
            imageData: { ...this.imgData },
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            rectWidth: this.rectWidth,
            rectHeight: this.rectHeight
        });
    }

    // 销毁实例
    destroy() {
        this.imageLoaded = false;
        this.imgData = {};
        this.touch = {};
        this.options = null;
        this.onUpdate = null;
    }
}
