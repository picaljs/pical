# Pical

[![GitHub Actions][actions-badge]][actions]
[![Docker Pulls][docker-pull]][docker]
[![Docker Stars][docker-star]][docker]
[![Docker Image Size][docker-size]][docker-tag]
[![Docker Layer][docker-layer]][docker-tag]
[![License][license-badge]][license]
[![semantic-release][semantic-release-badge]][semantic-release]

Pical is an on-the-fly image manipulation application. It uses [sharp](https://github.com/lovell/sharp) for image manipulation application.

## Table of Content

- [Getting Started](#getting-started)
- [Guide](#guide)
  - [Authentication](#authentication)
    - [API Token](#api-token)
    - [Global API Key](#global-api-key)
    - [Zone ID](#zone-id)
  - [Configuration](#configuration)
    - [File](#file)
    - [Environment Variables](#environment-variables)
- [Migration](#migration)
- [Frequently Asked Questions](#frequently-asked-questions)

## Getting Started

```bash
docker run -d -p 8080:8080 pical/pical
```

## Generating URL

**Unsigned URL**

```
<domain>/p/<path>@<format>?<query>
```

**Signed URL**

```
<domain>/s/<signature>/<path>@<format>?<query>
```

- **signature**: Add `PICAL_KEY` to the start of `/<path>@<format>?<query>` and calculate the HMAC digest using SHA256, and encode the first 32 bytes result with URL-safe Base64. `@pical/signature` can be used to generate the signature.
- **path**: Path of the image. It is the relative path from the base directory if it is using local storage. It is the relative path from the root directory if it is using S3 storage.
- **format**: Format of the output image. E.g. `png`, `jpg`, `webp`. `original` is supported without transformation.
- **query**: Query string for pass parameter to sharp. E.g. `format[progressive]=true&resize[width]=300&greyscale=true`. It is parsed by [qs](https://github.com/ljharb/qs) and it is passed by `<method>[<parameter>]` (except `format` is for `toFormat`). Please refer to [sharp documentation](https://sharp.pixelplumbing.com/).

## Configuration

Pical can be configure by environment variable.

## Local Storage

Default storage for Pical.

- **PICAL_LOCAL_BASE_DIR**: (Optional) `/data` by default.

### S3 Storage

To enable S3 storage, `PICAL_S3_END_POINT`, `PICAL_S3_BUCKET`, `PICAL_S3_ACCESS_KEY`, and `PICAL_S3_SECRET_KEY` must be set.

- **PICAL_S3_END_POINT**: S3 Endpoint
- **PICAL_S3_BUCKET**: S3 Bucket
- **PICAL_S3_ACCESS_KEY**: S3 Access Key
- **PICAL_S3_SECRET_KEY**: S3 Secret Key
- **PICAL_S3_USE_SSL**: (Optional) Enable SSL connection to S3 endpoint. `true` by default.
- **PICAL_S3_PORT**: (Optional) Port of the S3 Endpoint
- **PICAL_S3_REGION**: (Optional)
- **PICAL_S3_SESSION_TOKEN**: (Optional)
- **PICAL_S3_PART_SIZE**: (Optional)

### Other

- **PICAL_KEY**: Key for generating signature.
- **PICAL_SALT**: Salt for generating signature.
- **NODE_ENV**: (Optional) `production` by default.
- **PICAL_UNSAFE_PLAIN**: (Optional) Allow unsigned url if it is set to `true`. `false` if `NODE_ENV` is set to `production` by default.
- **PICAL_PORT**: (Optional) `8080` by default.
- **PICAL_CACHE**: (Optional) `max-age` header. `604800` by default.

[actions-badge]: https://github.com/picaljs/pical/workflows/Main/badge.svg
[actions]: https://github.com/picaljs/pical/actions
[docker]: https://hub.docker.com/r/pical/pical/
[docker-tag]: https://hub.docker.com/r/pical/pical/tags/
[docker-pull]: https://img.shields.io/docker/pulls/pical/pical.svg
[docker-star]: https://img.shields.io/docker/stars/pical/pical.svg
[docker-size]: https://img.shields.io/microbadger/image-size/pical/pical.svg
[docker-layer]: https://img.shields.io/microbadger/layers/pical/pical.svg
[license]: https://github.com/picaljs/pical/blob/master/LICENSE
[license-badge]: https://img.shields.io/github/license/picaljs/pical.svg
[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release]: https://github.com/semantic-release/semantic-release
