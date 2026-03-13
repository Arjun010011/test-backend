<x-mail::message>
# Greetings from Edubricz Team

You are receiving this message because you are part of the {{ $collection->name }} collection.

{!! nl2br(e($messageBody)) !!}

Thanks,<br>
Edubricz Team
</x-mail::message>
