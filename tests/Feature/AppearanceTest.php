<?php

test('light appearance cookie is passed to the app shell', function () {
    $response = $this->withUnencryptedCookie('appearance', 'light')->get('/');

    $response->assertOk();
    $response->assertSee('const appearance = \'light\';', false);
    $response->assertDontSee('<html lang="en" class="dark">', false);
});

test('dark appearance cookie adds dark class to html shell', function () {
    $response = $this->withUnencryptedCookie('appearance', 'dark')->get('/');

    $response->assertOk();
    $response->assertSee('const appearance = \'dark\';', false);
    $response->assertSee('<html lang="en" class="dark">', false);
});
