// pages/index/photo.js
import * as tf from '@tensorflow/tfjs';

const MODEL_PATH =
  // tslint:disable-next-line:max-line-length
  'https://ilego.club/ai/tfjs-models/mobilenet/1/model.json';

//引入本地json数据
var dogs_json = require('../../utils/dogs_data.js');

const IMAGE_SIZE = 224;

let that;
let mobilenet;
const load_model = async () => {
  console.log('Loading model...');
  wx.showLoading({
    title: '正在加载模型...',
  });

  mobilenet = await tf.loadLayersModel(MODEL_PATH);

  // Warmup the model. This isn't necessary, but makes the first prediction
  // faster. Call `dispose` to release the WebGL memory allocated for the return
  // value of `predict`.
  mobilenet.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();

  getImageData('dogCanvas', that.data.imgUrl, function (imgData) {
    //  在此处得到的RGB数据
    console.log("getImageData");
    predict(imgData);
  });
}

// 获取图像RGB数据
var getImageData = function (canvasId, imgUrl, callback, imgWidth, imgHeight) {
  console.log("entering getImageData");

  const ctx = wx.createCanvasContext(canvasId);
  ctx.drawImage(imgUrl, 0, 0, imgWidth || IMAGE_SIZE, imgHeight || IMAGE_SIZE);
  ctx.draw(false, () => {
    console.log("ctx.draw");
    // API 1.9.0 获取图像数据
    wx.canvasGetImageData({
      canvasId: canvasId,
      x: 0,
      y: 0,
      width: imgWidth || IMAGE_SIZE,
      height: imgHeight || IMAGE_SIZE,
      success(res) {
        var result = res;
        console.log("buf:" + [result.data.buffer]);

        // RGBA to RGB
        var rgbData = new Uint8Array(res.width * res.height * 3);
        let idx = 0;
        for (let i = 0; i < res.data.length; i += 4) {
          rgbData[idx] = res.data[i];
          rgbData[idx + 1] = res.data[i + 1];
          rgbData[idx + 2] = res.data[i + 2];
          idx += 3;
        }
        callback(rgbData);
      },
      fail: e => {
        console.error(e);
      },
    })
  })
};

/**
 * Given an image element, makes a prediction through mobilenet returning the
 * probabilities of the top K classes.
 */
async function predict(imgData) {
  wx.showLoading({
    title: '正在识别图像...',
  });

  // The first start time includes the time it takes to extract the image
  // from the HTML and preprocess it, in additon to the predict() call.
  const startTime1 = performance.now();
  // The second start time excludes the extraction and preprocessing and
  // includes only the predict() call.
  let startTime2;
  const logits = tf.tidy(() => {
    // tf.browser.fromPixels() returns a Tensor from an image element.
    const img = tf.tensor3d(imgData, [IMAGE_SIZE, IMAGE_SIZE, 3]).toFloat();

    const offset = tf.scalar(127.5);
    // Normalize the image from [0, 255] to [-1, 1].
    const normalized = img.sub(offset).div(offset);

    // Reshape to a single-element batch so we can pass it to predict.
    const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);

    startTime2 = performance.now();
    // Make a prediction through mobilenet.
    return mobilenet.predict(batched);
  });

  // Convert logits to probabilities and class names.
  const classes = await getTopClasses(logits);
  const totalTime1 = performance.now() - startTime1;
  const totalTime2 = performance.now() - startTime2;
  console.log(`Done in ${Math.floor(totalTime1)} ms ` +
    `(not including preprocessing: ${Math.floor(totalTime2)} ms)`);

  wx.hideLoading();

  var index = classes[0].index;
  var prob = classes[0].value;
  console.log(classes);
  if (prob > 0.1) {
    var dogInfo = that.data.dogList[index];
    console.log(dogInfo);
    that.setData({
      display: "block",
      cname: dogInfo["cname"],
      ename: dogInfo["ename"],
      description: dogInfo["description"],
    });
  } else {
    that.setData({
      display: "none"
    });
    wx.showModal({
      title: '提示',
      content: '对不起，无法识别！',
      showCancel: false,
    });
  }
}

/**
 * Computes the probabilities of the topK classes given logits by computing
 * softmax to get probabilities and then sorting the probabilities.
 * @param logits Tensor representing the logits from MobileNet.
 * @param topK The number of top predictions to show.
 */
export async function getTopClasses(logits) {
  const values = await logits.data();

  const valuesAndIndices = [];
  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({ value: values[i], index: i });
  }
  valuesAndIndices.sort((a, b) => {
    return b.value - a.value;
  });

  return valuesAndIndices;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: '',
    dogList: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this;
    this.setData({
      //dogs_json.dog_list获取dogs_data.js里定义的json数据，并赋值给dogList
      dogList: dogs_json.dog_list,
      imgUrl: options.filePath,
      display: "none"
    });

    load_model(predict);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})