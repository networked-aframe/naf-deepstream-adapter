# Networked-AFrame Deepstream Adapter

Network adapter for [networked-aframe](https://github.com/haydenjameslee/networked-aframe) that uses Deepstream as a backend.

## Running the Example

```
git clone https://github.com/networked-aframe/naf-deepstream-adapter
cd naf-deepstreame-adapter
npm install # or use yarn
# Set deepstream credentials in example/index.html
npm start
```

With the server running, browse the example at http://localhost:8080. Open another browser tab and point it to the same URL to see the other client.

## Setting Up Deepstream


Deepstream is an open-source "serverless" network solution. In NAF's case it can be used to establish connections between clients in a peer-to-peer fashion, without having to host a signalling (connection) server.

Steps to setup Deepstream:

1. Sign up for a DeepstreamHub account: https://deepstreamhub.com/
2. On the left navbar, click "Apps"
3. Add application
4. Name your application and choose a region close to you
5. Copy the URL at the bottom of your new project, it'll start with wss://xxx.deepstreamhub
6. Replace `YOUR_URL_HERE` in the [Deepstream Demo](https://github.com/haydenjameslee/networked-aframe/blob/master/server/static/deepstream-basic.html)
7. Open two tabs of the demo and you should see the other tab's avatar


## Use in an existing project

After setting up deepstream include and configure `naf-deepstream-adapter`.

```html
<html>
<head>
  <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
  <script src="https://unpkg.com/networked-aframe/dist/networked-aframe.min.js"></script>
  <!-- Include naf-deepstream-adapter *after* networked-aframe -->
  <script src="https://unpkg.com/naf-deepstream-adapter/dist/naf-deepstream-adapter.min.js"></script>

  <!-- Set the Deepstream credentials -->
  <script>
    window.deepstreamConfig = {
      'url': 'YOUR_URL_HERE'
    };
  </script>
</head>
<body>
    <!-- Set adapter to deepstream -->
   <a-scene networked-scene="
        adapter: deepstream;
    ">
  </a-scene>
</body>
</html>
```
