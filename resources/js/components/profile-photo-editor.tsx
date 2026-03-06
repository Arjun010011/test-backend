import { useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { updateProfilePhoto } from '@/actions/App/Http/Controllers/Candidate/OnboardingController';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  name: string;
  currentPhotoUrl: string | null;
  helpText?: string;
  className?: string;
};

export default function ProfilePhotoEditor({
  name,
  currentPhotoUrl,
  helpText,
  className,
}: Props) {
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<{
    profile_photo: File | null;
    remove_profile_photo: boolean;
  }>({
    profile_photo: null,
    remove_profile_photo: false,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentPhotoUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const initials = name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handlePhotoUpload = (file: File) => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarUrl(objectUrl);

    router.post(
      updateProfilePhoto().url,
      {
        profile_photo: file,
        remove_profile_photo: '0',
      },
      {
        preserveScroll: true,
        forceFormData: true,
        onStart: () => form.clearErrors(),
        onSuccess: () => {
          if (profilePhotoInputRef.current !== null) {
            profilePhotoInputRef.current.value = '';
          }
          setPreviewUrl(null);
        },
        onError: (errors) => {
          form.setError(errors);
        }
      }
    );
  };

  const handlePhotoRemove = () => {
    router.post(
      updateProfilePhoto().url,
      {
        remove_profile_photo: '1',
      },
      {
        preserveScroll: true,
        forceFormData: true,
        onStart: () => form.clearErrors(),
        onSuccess: () => {
          setAvatarUrl(null);

          if (previewUrl !== null) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        },
        onError: (errors) => {
          form.setError(errors);
        }
      }
    );
  };

  return (
    <section
      className={
        className ?? 'rounded-2xl border border-border/70 bg-card p-5'
      }
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="h-24 w-24 border border-border/70 shadow-sm">
          <AvatarImage src={avatarUrl ?? undefined} alt={name} />
          <AvatarFallback className="text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label className="text-sm font-medium text-primary">
            Profile photo
          </Label>
          <p className="text-xs text-muted-foreground">
            {helpText ?? 'JPG/PNG/WEBP up to 2MB'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={form.processing}
            onClick={() => profilePhotoInputRef.current?.click()}
          >
            {avatarUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={form.processing}
              onClick={handlePhotoRemove}
            >
              Remove
            </Button>
          )}
        </div>
        <Input
          ref={profilePhotoInputRef}
          id="profile_photo_uploader"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              handlePhotoUpload(file);
            }
          }}
        />
        {form.progress && (
          <p className="text-xs text-muted-foreground">
            Uploading {form.progress.percentage}%
          </p>
        )}
        <InputError message={form.errors.profile_photo} />
      </div>
    </section>
  );
}
