phpab 1.25.0 - Copyright (C) 2009 - 2018 by Arne Blankerts and Contributors

Scanning directory src

<?php
// @codingStandardsIgnoreFile
// @codeCoverageIgnoreStart
// this is an autogenerated file - do not edit
spl_autoload_register(
    function($class) {
        static $classes = null;
        if ($classes === null) {
            $classes = array(
                'paragonie\\constanttime\\base32' => '/Base32.php',
                'paragonie\\constanttime\\base32hex' => '/Base32Hex.php',
                'paragonie\\constanttime\\base64' => '/Base64.php',
                'paragonie\\constanttime\\base64dotslash' => '/Base64DotSlash.php',
                'paragonie\\constanttime\\base64dotslashordered' => '/Base64DotSlashOrdered.php',
                'paragonie\\constanttime\\base64urlsafe' => '/Base64UrlSafe.php',
                'paragonie\\constanttime\\binary' => '/Binary.php',
                'paragonie\\constanttime\\encoderinterface' => '/EncoderInterface.php',
                'paragonie\\constanttime\\encoding' => '/Encoding.php',
                'paragonie\\constanttime\\hex' => '/Hex.php',
                'paragonie\\constanttime\\rfc4648' => '/RFC4648.php'
            );
        }
        $cn = strtolower($class);
        if (isset($classes[$cn])) {
            require __DIR__ . $classes[$cn];
        }
    },
    true,
    false
);
// @codeCoverageIgnoreEnd


