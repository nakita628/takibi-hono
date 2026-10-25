<h1 id="petstore">Petstore v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# Authentication

* API Key (apiKey)
    - Parameter Name: **X-API-Key**, in: header.

<h1 id="petstore-pets">pets</h1>

Everything about pets

## List pets

<a id="opIdlistPets"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets \
  -H 'Accept: application/json'
```

`GET /pets`

Lists the pets, newest first.

<h3 id="list-pets-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|integer|false|How many pets to return|
|tag|query|[Tag](#schematag)|false|none|
|session|cookie|string|false|none|
|X-Request-Id|header|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|tag|dog|
|tag|cat|
|tag|bird|

> Example responses

> 200 Response

```json
[
  {
    "id": 0,
    "name": "string",
    "tag": "dog"
  }
]
```

<h3 id="list-pets-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|The pets|Inline|

<h3 id="list-pets-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[Pet](#schemapet)]|false|none|none|
|» id|integer|true|none|none|
|» name|string|true|none|none|
|» tag|[Tag](#schematag)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|» tag|dog|
|» tag|cat|
|» tag|bird|

### Response Headers

|Status|Header|Type|Format|Description|
|---|---|---|---|---|
|200|X-Total-Count|integer||Total number of pets|

<aside class="success">
This operation does not require authentication
</aside>

## Create a pet

<a id="opIdcreatePet"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "name": "string",
    "tag": "dog"
  }'
```

`POST /pets`

> Body parameter

```json
{
  "name": "string",
  "tag": "dog"
}
```

<h3 id="create-a-pet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|X-Request-Id|header|string|false|none|
|body|body|[NewPet](#schemanewpet)|true|none|
|» name|body|string|true|none|
|» tag|body|[Tag](#schematag)|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» tag|dog|
|» tag|cat|
|» tag|bird|

> Example responses

> 201 Response

```json
{
  "id": 0,
  "name": "string",
  "tag": "dog"
}
```

<h3 id="create-a-pet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|Created|Created|[Pet](#schemapet)|
|400|Bad Request|Bad request|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
apiKey
</aside>

<h1 id="petstore-default">Default</h1>

## Health

<a id="opIdhealth"></a>

> Code samples

```bash
curl http://localhost:3000/api/ \
  -H 'Accept: application/json'
```

`GET /`

> Example responses

> 200 Response

```json
{
  "status": "ok"
}
```

<h3 id="health-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|OK|Inline|

<h3 id="health-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|status|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## pingPets

<a id="opIdpingPets"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets \
  -X HEAD
```

`HEAD /pets`

<h3 id="pingpets-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|X-Request-Id|header|string|false|none|

<h3 id="pingpets-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|OK|None|

<aside class="success">
This operation does not require authentication
</aside>

## getPet

<a id="opIdgetPet"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets/1 \
  -H 'Accept: application/json'
```

`GET /pets/{petId}`

<aside class="warning">
This operation is deprecated
</aside>

<h3 id="getpet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|petId|path|integer|true|none|

> Example responses

> 200 Response

```json
{
  "id": 0,
  "name": "string",
  "tag": "dog"
}
```

> 404 Response

```json
{
  "message": "string"
}
```

<h3 id="getpet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|The pet|[Pet](#schemapet)|
|404|Not Found|Not found|[Error](#schemaerror)|

<aside class="success">
This operation does not require authentication
</aside>

## deletePet

<a id="opIddeletePet"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets/0 \
  -X DELETE
```

`DELETE /pets/{petId}`

<h3 id="deletepet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|petId|path|integer|true|none|

<h3 id="deletepet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|No Content|Deleted|None|

<aside class="success">
This operation does not require authentication
</aside>

## uploadPhoto

<a id="opIduploadPhoto"></a>

> Code samples

```bash
curl http://localhost:3000/api/pets/0/photos \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'caption=string&featured=true'
```

`POST /pets/{petId}/photos`

> Body parameter

```yaml
caption: string
featured: true
```

<h3 id="uploadphoto-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|petId|path|integer|true|none|
|body|body|object|false|none|
|» caption|body|string|true|none|
|» featured|body|boolean|false|none|

<h3 id="uploadphoto-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|Created|Uploaded|None|

<aside class="success">
This operation does not require authentication
</aside>

## listReports

<a id="opIdlistReports"></a>

> Code samples

```bash
curl http://localhost:3000/api/2024-01/reports \
  -H 'Accept: application/json'
```

`GET /2024-01/reports`

> Example responses

> 200 Response

```json
[
  "string"
]
```

<h3 id="listreports-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|OK|Inline|

<h3 id="listreports-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[string]|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="petstore-webhooks">Webhooks</h1>

## A pet was added

<a id="opIdonPetAdded"></a>

`POST petAdded`

> Body parameter

```json
{
  "id": 0,
  "name": "string",
  "tag": "dog"
}
```

<h3 id="a-pet-was-added-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[Pet](#schemapet)|true|none|
|» id|body|integer|true|none|
|» name|body|string|true|none|
|» tag|body|[Tag](#schematag)|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» tag|dog|
|» tag|cat|
|» tag|bird|

<h3 id="a-pet-was-added-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|Acknowledged|None|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_Tag">Tag</h2>
<!-- backwards compatibility -->
<a id="schematag"></a>
<a id="schema_Tag"></a>
<a id="tocStag"></a>
<a id="tocstag"></a>

```json
"dog"
```

<h2 id="tocS_Pet">Pet</h2>
<!-- backwards compatibility -->
<a id="schemapet"></a>
<a id="schema_Pet"></a>
<a id="tocSpet"></a>
<a id="tocspet"></a>

```json
{
  "id": 0,
  "name": "string",
  "tag": "dog"
}
```

A pet in the store

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|integer|true|none|none|
|name|string|true|none|none|
|tag|[Tag](#schematag)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|tag|dog|
|tag|cat|
|tag|bird|

<h2 id="tocS_NewPet">NewPet</h2>
<!-- backwards compatibility -->
<a id="schemanewpet"></a>
<a id="schema_NewPet"></a>
<a id="tocSnewpet"></a>
<a id="tocsnewpet"></a>

```json
{
  "name": "string",
  "tag": "dog"
}
```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|tag|[Tag](#schematag)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|tag|dog|
|tag|cat|
|tag|bird|

<h2 id="tocS_Error">Error</h2>
<!-- backwards compatibility -->
<a id="schemaerror"></a>
<a id="schema_Error"></a>
<a id="tocSerror"></a>
<a id="tocserror"></a>

```json
{
  "message": "string"
}
```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|message|string|true|none|none|
