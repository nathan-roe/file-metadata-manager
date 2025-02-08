import React from "react";
import {
    Title,
    Text,
    Group,
    Card,
    Box,
    Stack,
    Grid,
    SegmentedControl,
    Container,
    Image,
    Button,
    Dialog, Modal, MultiSelect, TextInput, Select,
    List,
    Divider, LoadingOverlay, ActionIcon
} from "@mantine/core";
import '@mantine/dropzone/styles.css';
import ExifReader from "exifreader";
import {Dropzone, FileWithPath, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {IconPhoto, IconUpload, IconX} from "@tabler/icons-react";
import leaflet from 'leaflet';
import {downloadImageFromSource, formatFileDescription} from "../utils/fileUtils";
import {useTranslation} from "react-i18next";

const piexif = require('piexifjs/piexif');

interface FileAttribute {
    name: string;
    description: string;
}

enum MetaDataManagementType {
    PARSE = "parse",
    SCRUB = "scrub",
    MODIFY = "modify"
}

export function Home() {
    const {t} = useTranslation();
    const [modifyFileDialogOpen, setModifyFileDialogOpen] = React.useState(false);
    const [fileManagementType, setFileManagementType] = React.useState(MetaDataManagementType.PARSE);
    const [modifiedImageSrc, setModifiedImageSrc] = React.useState<string>("");
    const [fileAttributes, setFileAttributes] = React.useState<FileAttribute[]>([]);
    const [uploadedFile, setUploadedFile] = React.useState<FileWithPath>();

    const handleUpload = React.useCallback((files: FileWithPath[]) => {
        setUploadedFile(files[0]);
        switch (fileManagementType) {
            case  MetaDataManagementType.MODIFY:
                setModifyFileDialogOpen(true);
                break;
            case MetaDataManagementType.SCRUB:
                break;
            case MetaDataManagementType.PARSE:
            default:
                ExifReader.load(files[0]).then((tags: Record<string, any>) => {
                    setFileAttributes(Object.entries(tags).map(([key, attribute]) => {
                        return {
                            name: key,
                            description: formatFileDescription(key, attribute.value)
                        };
                    }));
                });
                break;
        }
    }, [fileManagementType]);

    console.log("fileAttributes: ", window)

    React.useEffect(() => {
        const startingLocation: [number, number] = [0, 0];
        const map = leaflet.map('leaflet-map', {
            center: startingLocation,
            zoom: 10
        });
        leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
        ).addTo(map);
        leaflet.marker(startingLocation).addTo(map);
    }, []);

    console.log("modifiedImageSrc: ", modifiedImageSrc)

    return (
        <>
            <Grid gutter={0} mt={50}>
                <Grid.Col span={{base: 12, lg: 6}} px={20}>
                    <Stack justify="space-between" h="100%" w="100%">
                        <Stack h="fit-content" w="100%">
                            <Title ta="center">{t("title")}</Title>
                            <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl" mb={20}>
                                {t("subtitle")}
                            </Text>
                        </Stack>
                        {
                            modifiedImageSrc
                                ? (
                                    <Stack>
                                        <Image src={modifiedImageSrc}/>
                                        <Button onClick={() => downloadImageFromSource("download.jpeg", modifiedImageSrc)}>
                                            Download Modified Image
                                        </Button>
                                    </Stack>
                                )
                                : <Box hidden={!fileAttributes.length} id="leaflet-map" mah={400} h="100%" w="100%"/>
                        }
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{base: 12, lg: 6}} px={20}>
                    <Group w="100%" align="center" justify="space-between">
                        <SegmentedControl
                            data={Object.values(MetaDataManagementType).map(value => ({
                                value,
                                label: t(`metaDataManagementType.${value}.title`)
                            }))}
                            value={fileManagementType}
                            onChange={type => setFileManagementType(type as MetaDataManagementType)}
                        />
                    </Group>
                    <Dropzone
                        onDrop={handleUpload}
                        onReject={(files) => console.log('rejected files', files)}
                        accept={IMAGE_MIME_TYPE}
                        multiple={false}
                    >
                        <Group justify="center" gap="xl" mih={220} style={{pointerEvents: 'none'}}>
                            <Dropzone.Accept>
                                <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5}/>
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5}/>
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5}/>
                            </Dropzone.Idle>

                            <div>
                                <Text size="xl" inline>
                                    {t('dragImage')}
                                </Text>
                                <Text size="sm" c="dimmed" inline mt={7}>
                                    {t('attachFile')}
                                </Text>
                            </div>
                        </Group>
                    </Dropzone>
                    <Container p={0} mah={400} style={{overflow: 'auto'}}>
                        {fileAttributes.map((fileAttribute: FileAttribute) => (
                            <Card withBorder>
                                <Group key={fileAttribute.name} align="center" justify="space-between" w="100%"
                                       style={{overflowX: 'hidden', flexWrap: 'nowrap', '--group-wrap': 'nowrap'}}>
                                    <Text mr={50}>{fileAttribute.name}</Text>
                                    <Text>{fileAttribute.description}</Text>
                                </Group>
                            </Card>
                        ))}
                    </Container>
                </Grid.Col>
            </Grid>
            <FileModificationDialog
                open={modifyFileDialogOpen}
                onClose={() => setModifyFileDialogOpen(false)}
                setModifiedImageSrc={setModifiedImageSrc}
                uploadedFile={uploadedFile}
            />
        </>
    );
}


enum MetadataTypes {
    EXIF = "exif",
    GPS = "gps",
    ZEROTH = "ifd"
}

const EXIF_DATA_MAP = {
    [MetadataTypes.EXIF]: Object.keys(piexif.ExifIFD).sort(),
    [MetadataTypes.ZEROTH]: Object.keys(piexif.ImageIFD).sort(),
    [MetadataTypes.GPS]: Object.keys(piexif.GPSIFD).sort(),
}

const _defaultMetaDataAttributes = {
    [MetadataTypes.EXIF]: {},
    [MetadataTypes.GPS]: {},
    [MetadataTypes.ZEROTH]: {},
}

const formatModifiedAttributes = (attribute: Record<string, unknown>) => {
    Object.entries(attribute).forEach(([key, value]) => {
        try {
            attribute[key] = JSON.parse(value as string);
        } catch (e) {}
    });
    return attribute;
}

interface FileModificationDialogProps {
    open: boolean;
    onClose: () => void;
    uploadedFile?: FileWithPath;
    setModifiedImageSrc: React.Dispatch<React.SetStateAction<string>>;
}

const FileModificationDialog: React.FC<FileModificationDialogProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           uploadedFile,
                                                                           setModifiedImageSrc
                                                                       }) => {
    const {t} = useTranslation();
    const [updatingFile, setUpdatingFile] = React.useState(false);
    const [selectedExifType, setSelectedExifType] = React.useState<string>(MetadataTypes.EXIF);
    const [selectedMetaDataType, setSelectedMetaDataType] = React.useState<string>(EXIF_DATA_MAP[MetadataTypes.EXIF][0]);
    const [metaDataValue, setMetaDataValue] = React.useState<string>("");
    const [modifiedAttributes, setModifiedAttributes] = React.useState<Record<MetadataTypes, Record<string, unknown>>>(_defaultMetaDataAttributes);

    const handleClose = React.useCallback(() => {
        setUpdatingFile(false);
        setSelectedMetaDataType(MetadataTypes.EXIF);
        setSelectedMetaDataType(EXIF_DATA_MAP[MetadataTypes.EXIF][0]);
        setMetaDataValue("");
        setModifiedAttributes(_defaultMetaDataAttributes);
        onClose();
    }, [onClose]);

    const modifyExifDataInFile = React.useCallback(() => {
        if (!uploadedFile) {
            return;
        }
            setUpdatingFile(true);
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                const imageData = piexif.load(e.target?.result);
                const modifiedData = {
                    "0th": formatModifiedAttributes(modifiedAttributes[MetadataTypes.ZEROTH]),
                    "Exif": formatModifiedAttributes(modifiedAttributes[MetadataTypes.EXIF]),
                    "GPS": formatModifiedAttributes(modifiedAttributes[MetadataTypes.GPS])
                };
                Object.keys(modifiedData).forEach(key => {
                    if(!Object.keys(modifiedData[key as keyof typeof modifiedData]).length) {
                        delete modifiedData[key as keyof typeof modifiedData];
                    }
                });
                console.log("imageData: ", imageData)
                Object.keys(modifiedData).forEach(key => {
                    imageData[key] = {
                        ...imageData[key],
                        ...modifiedData[key as keyof typeof modifiedData]
                    };
                });
                const exifStr = piexif.dump(imageData);
                setModifiedImageSrc(piexif.insert(exifStr, e.target?.result));
                handleClose();
            } catch(e) {
                setUpdatingFile(false);
                console.error("Failed to update file: ", e);
            }
            };
            reader.readAsDataURL(uploadedFile);
    }, [uploadedFile, modifiedAttributes]);

    const updateMetaData = React.useCallback(() => {
        setModifiedAttributes(ma => ({
            ...ma,
            [selectedExifType]: {
                ...ma[selectedExifType as MetadataTypes],
                [selectedMetaDataType]: metaDataValue
            }
        }));
        setMetaDataValue("");
    }, [metaDataValue, selectedMetaDataType, selectedExifType]);

    const removeAttribute = React.useCallback((type: MetadataTypes, attribute: string) => {
        setModifiedAttributes(ma => {
            const metaDataForType = {...ma[type]};
            delete metaDataForType[attribute];
            return {...ma, [type]: metaDataForType};
        });
    }, []);

    return (
        <>
            <Modal size="xl" opened={open} onClose={handleClose} title="Modify Image Metadata">
                <Stack pt={20} w="100%" h="100%" mih={500}>
                    <Grid>
                        <Grid.Col span={3}>
                            <Select
                                data={Object.values(MetadataTypes).map(value => ({
                                    value,
                                    label: t(value)
                                }))}
                                value={selectedExifType}
                                onChange={v => {
                                    setSelectedExifType(v || MetadataTypes.EXIF);
                                    setSelectedMetaDataType(EXIF_DATA_MAP[(v || MetadataTypes.EXIF) as MetadataTypes][0]);
                                    setMetaDataValue("");
                                }}
                            />
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <Select
                                data={EXIF_DATA_MAP[selectedExifType as MetadataTypes]}
                                value={selectedMetaDataType}
                                onChange={v => {
                                    setSelectedMetaDataType(v || EXIF_DATA_MAP[selectedExifType as MetadataTypes][0]);
                                    setMetaDataValue("");
                                }}
                            />
                        </Grid.Col>
                        <Grid.Col span={4.5}>
                            <TextInput
                                value={metaDataValue}
                                onChange={e => setMetaDataValue(e.target.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={1.5}>
                            <Group w="100%" justify="flex-end">
                                <Button w={75} onClick={updateMetaData} disabled={!metaDataValue || updatingFile}>Add</Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                    <Stack>
                        {Object.keys(modifiedAttributes).filter(key => Object.keys(modifiedAttributes[key as MetadataTypes]).length).map(key => (
                            <Stack key={key}>
                                <Text size="lg" fw="bold">{key}:</Text>
                                {Object.entries(modifiedAttributes[key as MetadataTypes]).map(([attribute, value]) => (
                                    <>
                                        <Group key={attribute} w="100%" justify="space-between" align="center" pl={30}>
                                            <Grid w="100%">
                                                <Grid.Col span={5}>
                                                    <Text>{attribute}</Text>
                                                </Grid.Col>
                                                <Grid.Col span={5}>
                                                    <Text>{String(value)}</Text>
                                                </Grid.Col>
                                                <Grid.Col span={2}>
                                                    <Group w="100%" justify="flex-end">
                                                        <ActionIcon size="sm" variant="transparent" onClick={() => removeAttribute(key as MetadataTypes, attribute)}>
                                                            <IconX />
                                                        </ActionIcon>
                                                    </Group>
                                                </Grid.Col>
                                            </Grid>
                                        </Group>
                                        <Divider w="100%"/>
                                    </>
                                ))}
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
                <Group w="100%" justify="flex-end">
                    <Button w={75} onClick={modifyExifDataInFile} mt={20} disabled={
                        updatingFile ||
                        Object.keys(modifiedAttributes).every(key =>
                            !Object.values(modifiedAttributes[key as MetadataTypes]).filter(Boolean).length
                        )
                    }>
                        Save
                    </Button>
                </Group>
            </Modal>
            {updatingFile && (
                <LoadingOverlay />
            )}
        </>
    );
}
