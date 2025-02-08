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
    Divider, LoadingOverlay, ActionIcon,
    Menu
} from "@mantine/core";
import '@mantine/dropzone/styles.css';
import ExifReader from "exifreader";
import {Dropzone, FileWithPath, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {IconCaretDown, IconPhoto, IconUpload, IconX} from "@tabler/icons-react";
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
    MODIFY = "modify",
    OCR = "ocr",
    TRANSCRIBE = "transcribe",
    OBJECT_DETECTION = "od"
}

export function Home() {
    const {t} = useTranslation();
    const [modifyFileDialogOpen, setModifyFileDialogOpen] = React.useState(false);
    const [fileTypeError, setFileTypeError] = React.useState(false);
    const [fileManagementType, setFileManagementType] = React.useState(MetaDataManagementType.PARSE);
    const [modifiedImageSrc, setModifiedImageSrc] = React.useState<string>("");
    const [fileAttributes, setFileAttributes] = React.useState<FileAttribute[]>([]);
    const [uploadedFile, setUploadedFile] = React.useState<FileWithPath>();

    const removeExifDataFromFile = React.useCallback((file: FileWithPath) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                setModifiedImageSrc(piexif.remove(e.target?.result));
            } catch (e) {
                console.error("Failed to remove EXIF data from file: ", e);
            }
        };
        reader.readAsDataURL(file);
    }, [uploadedFile]);

    const handleUpload = React.useCallback((files: FileWithPath[]) => {
        setUploadedFile(files[0]);
        setModifiedImageSrc("");
        setFileTypeError(false);
        switch (fileManagementType) {
            case MetaDataManagementType.MODIFY:
                if(files[0].type.endsWith("jpeg")) {
                    setModifyFileDialogOpen(true);
                } else {
                    setFileTypeError(true);
                }
                break;
            case MetaDataManagementType.SCRUB:
                if(files[0].type.endsWith("jpeg")) {
                    removeExifDataFromFile(files[0]);
                } else {
                    setFileTypeError(true);
                }
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

    return (
        <Grid mt="25px" pt={75} gutter={0} h="calc(100vh - 25px)" style={{overflow: 'auto'}}>
            <Grid.Col span={{xs: 12, sm: 2, md: 3, xl: 4}}></Grid.Col>
            <Grid.Col span={{xs: 12, sm: 8, md: 6, xl: 4}}>
                <Stack gap={0}>
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
                    {[MetaDataManagementType.SCRUB, MetaDataManagementType.MODIFY].includes(fileManagementType) && (
                        <Text size="sm" c={fileTypeError ? "red" : "dimmed"}>
                            {t(`metaDataManagementType.${fileTypeError ? "fileTypeError" : "supportedFileTypes"}`)}
                        </Text>
                    )}
                    {
                        (!!fileAttributes.length && [MetaDataManagementType.PARSE].includes(fileManagementType)) && (
                            <Group mt={20} justify="flex-end">
                                <Menu>
                                    <Menu.Target>
                                        <Button variant="transparent">
                                            <Text mr={5} mt={2}>Download as</Text>
                                            <IconCaretDown />
                                        </Button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item>CSV</Menu.Item>
                                        <Menu.Item>JSON</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        )
                    }
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
                            : (
                                <Box hidden={!fileAttributes.length} id="leaflet-map" h={200} w="100%"/>
                            )
                    }
                    {fileAttributes.map((fileAttribute: FileAttribute) => (
                        <Card withBorder>
                            <Group key={fileAttribute.name} align="center" justify="space-between" w="100%"
                                   style={{overflowX: 'hidden', flexWrap: 'nowrap', '--group-wrap': 'nowrap'}}>
                                <Text mr={50}>{fileAttribute.name}</Text>
                                <Text>{fileAttribute.description}</Text>
                            </Group>
                        </Card>
                    ))}
                    <FileModificationDialog
                        open={modifyFileDialogOpen}
                        onClose={() => setModifyFileDialogOpen(false)}
                        setModifiedImageSrc={setModifiedImageSrc}
                        setFileAttributes={setFileAttributes}
                        uploadedFile={uploadedFile}
                    />
                </Stack>
            </Grid.Col>
            <Grid.Col span={{xs: 12, sm: 2, md: 3, xl: 4}}></Grid.Col>
        </Grid>
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

const formatModifiedAttributes = (attribute: Record<string, unknown>, typeMap: Record<string, string>) => {
    const attributeMap: Record<string, unknown> = {}
    Object.entries(attribute).forEach(([key, value]) => {
        try {
            attributeMap[typeMap[key]] = JSON.parse(value as string);
        } catch (e) {
            attributeMap[typeMap[key]] = value;
        }
    });
    return attributeMap;
}

interface FileModificationDialogProps {
    open: boolean;
    onClose: () => void;
    uploadedFile?: FileWithPath;
    setModifiedImageSrc: React.Dispatch<React.SetStateAction<string>>;
    setFileAttributes: React.Dispatch<React.SetStateAction<FileAttribute[]>>;
}

const FileModificationDialog: React.FC<FileModificationDialogProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           uploadedFile,
                                                                           setModifiedImageSrc,
                                                                           setFileAttributes
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
                const modifiedData = {
                    "0th": formatModifiedAttributes(modifiedAttributes[MetadataTypes.ZEROTH], piexif.ImageIFD),
                    "Exif": formatModifiedAttributes(modifiedAttributes[MetadataTypes.EXIF], piexif.ExifIFD),
                    "GPS": formatModifiedAttributes(modifiedAttributes[MetadataTypes.GPS], piexif.GPSIFD)
                };
                const exifStr = piexif.dump(modifiedData);
                setModifiedImageSrc(piexif.insert(exifStr, e.target?.result));
                const flatModifiedAttributes = Object.values(modifiedAttributes).reduce((a,b) => ({...a, ...b}), {})
                setFileAttributes(fa => [
                ...fa.filter(f => !flatModifiedAttributes[f.name]),
                ...Object.entries(flatModifiedAttributes).map(([key, value]) => ({
                        name: key,
                        description: value
                    }))
                ] as FileAttribute[])
                handleClose();
            } catch (e) {
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
                                <Button w={75} onClick={updateMetaData}
                                        disabled={!metaDataValue || updatingFile}>Add</Button>
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
                                                        <ActionIcon size="sm" variant="transparent"
                                                                    onClick={() => removeAttribute(key as MetadataTypes, attribute)}>
                                                            <IconX/>
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
                <LoadingOverlay/>
            )}
        </>
    );
}
