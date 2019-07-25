# AIDog

一款从图片识别狗的类别的应用，包括Android版和微信小程序版。

## 源码说明

* data

  包含狗的类别信息的数据及处理脚本，数据收集自百度百科和维基百科。

  * dogs.xls - Office Excel格式的数据
  * dogs.csv - CSV格式的数据
  * csv_to_json.py - CSV格式转换为JSON格式的脚本，在微信小程序和Android程序中都使用JSON格式的数据

* serving

  包含重新训练狗类别识别模型的脚本，以及相应的Jupyter notebook

  * retrain.py - 从Inception V3模型重新训练狗类别识别模型的脚本
  * retrain.ipynb
