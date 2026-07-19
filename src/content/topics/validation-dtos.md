---
title: "Validation & DTOs"
tldr: Check every request against a declared shape at the edge, before business logic ever sees it.
category: backend
tech: web
order: 39
level: 1
tags: [validation, dto, api, input]
related: [rest-api-design, security-owasp-basics, nest-request-lifecycle]
quiz:
  - q: "A request includes an extra field isAdmin: true that your endpoint never asked for. What should happen to it?"
    a: "Strip it. A DTO whitelists known fields, so unknown fields are removed or rejected before the data reaches business logic."
  - q: "Validation fails on two fields. What should the API return?"
    a: "One 422 response with a per-field error map, so the client can show each message next to the right input."
  - q: "The frontend already validates the form in the browser. Can the backend skip validation?"
    a: "No. Anyone can call the API directly with curl or a script. Client-side checks are for user experience, server-side checks are for safety."
links:
  - title: Laravel Validation
    url: https://laravel.com/docs/validation
    note: Form requests, rules, and per-field error messages.
  - title: MDN on 422 Unprocessable Content
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
    note: The status code for well-formed but invalid input.
---

## Analogy

Airport security. Every bag goes through the scanner at the entrance, not at the
gate and not on the plane. Past that point, staff can trust that every bag was
checked once, in one place. Validation works the same way: check everything at
the door so the rest of the code never has to.

## Never trust input

Anything a client sends can be wrong, missing, or hostile. The browser form is
not the only caller: curl, scripts, and attackers hit the same endpoint. So the
server validates every request itself, at the edge (the controller layer),
before any business logic or database call runs.

## DTO: the declared shape

A DTO (Data Transfer Object) is a class or schema that says exactly what an
endpoint accepts: which fields, which types, which limits. Everything else is
stripped (whitelisting). NestJS does this with class-validator decorators on DTO
classes; Laravel does it with FormRequest rules. Same idea, different syntax.

## Worked example

Build a "create product" endpoint that cannot receive garbage.

**Step 1: declare the shape as a DTO.** The class is the contract: two fields,
with limits, and nothing else.

```ts
class CreateProductDto {
  @IsString() @Length(1, 120)
  name: string

  @IsInt() @Min(0)
  priceCents: number
}
```

**Step 2: turn on validation at the edge, with whitelisting.** Unknown fields
like isAdmin are dropped before anything downstream sees them.

```ts
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true })
)
```

**Step 3: let the controller receive clean data.** By the time this runs, dto is
guaranteed valid, so the service needs no re-checks.

```ts
@Post()
create(@Body() dto: CreateProductDto) {
  return this.products.create(dto)
}
```

**Step 4: return per-field errors on failure.** Bad input gets a 422 with one
message per field, so a form can highlight each input.

```json
{
  "statusCode": 422,
  "errors": { "priceCents": ["priceCents must not be less than 0"] }
}
```

## Try it

Add an optional description field to the DTO with a 500 character limit, then
send a longer value. (You get one 422 that lists description; the controller and
service files stay untouched.)

## Real use case

An e-commerce store lets sellers create products. Without whitelisting, a seller
could POST featured: true and write into a column your form never exposed (mass
assignment). With a DTO, that field never survives the edge, and a negative
price is rejected before it can produce a broken checkout.

## Gotchas

- Client-side validation is a courtesy, not a defense. Repeat every check on the server.
- Whitelist, do not blacklist. New dangerous fields keep appearing; the list of allowed ones is stable.
- Some frameworks return 400 for validation failures by default. 422 is the more precise code; pick one and stay consistent.
- Validation checks shape (is this an email). Business rules (is this email already taken) still belong in the service layer.
- Validate query params, route params, and headers too, not just the JSON body.

## Remember

> Declare the shape, check it at the door, strip what you did not ask for, and
> answer bad input with 422 and per-field messages.
